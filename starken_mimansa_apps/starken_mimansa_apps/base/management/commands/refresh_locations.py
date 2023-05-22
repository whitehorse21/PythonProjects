# -*- coding: utf-8 -*-
from datetime import timedelta, datetime
import logging
import tempfile
import os
import sys
import traceback
import hashlib
import random
import string
import subprocess
import re
import uuid
import io

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from base.common import get_dls_connection
from base.models import *

from logging import FileHandler
project_root=os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__))))
logHandler = FileHandler(os.path.join(settings.BASE_DIR,'logs/refresh_locations_%s'%(datetime.now().strftime('%d.%m.%Y.log'))), 'a', encoding='UTF8')
logFormatter = logging.Formatter('%(levelname)s : %(asctime)s : %(process)d : %(message)s','%d/%m/%Y %I:%M:%S %p')
logHandler.setFormatter(logFormatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

def print_label_file(file_to_print, printer=None):
    try:
        logger.info('To be printed to the printer %s' % printer)
        if os.path.isfile(file_to_print):
            cmd_string = 'lp -d %s %s' % (printer, file_to_print)
            print_delay = 0.2
            subproc = subprocess.Popen([cmd_string, ''], env=os.environ, shell=True, stderr=subprocess.PIPE)
            times = 1
            subproc.poll()
            while True:
                if times > 5:
                    break
                if subproc.returncode is not None:
                    if subproc.returncode != 0:
                        stdoutval, stderr_str = subproc.communicate()
                        logger.error('print error: ' + str(stderr_str))
                        return (
                         False, str(stderr_str))
                    break
                else:
                    times += 1
                    time.sleep(0.2)
                    continue

        else:
            logger.error('File to print at path %s does not exists' % file_to_print)
        return True
    except Exception as e:
        logger.error('Exception in print_label_file: Exception is %s' % str(e))
        logger.error('Traceback is', exc_info=True)
        return False

    return


def translate_label(print_file_path, label_template_path, translate_dictionary):
    try:
        f = io.open(label_template_path, mode='r', encoding='utf-8')
    except Exception as e:
        logger.error('The Carton Label Template %s is missing' % label_template_path)
        raise

    try:
        outf = io.open(print_file_path, mode='a', encoding='utf-8')
        iterations = 0
        for each_line in f:
            iterations += 1
            for each_key in translate_dictionary:
                iterations += 1
                try:
                    substitution_value = translate_dictionary.get(each_key, '')
                    if not substitution_value:
                        substitution_value = ''
                    each_line = each_line.replace(each_key, substitution_value)
                except Exception as e:
                    keyval = None
                    logger.error('Exception %s replacing %s in %s' % (str(e), keyval, each_line))
                    logger.error('Traceback is', exc_info=True)

            outf.write(each_line)

        outf.close()
    except Exception as e:
        logger.error('Exception encountered in translate_label')
        logger.error('Traceback is', exc_info=True)
        raise

    return

def refresh_locations():

    rampa_location_type_object = LocationType.objects.get(code='D')
    classification_location_type_object = LocationType.objects.get(code='C')
    label_template_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'starken_label_locations.lbl')

    dls_connection = get_dls_connection()
    with dls_connection.cursor() as dls_cursor:
        logger.info("Finding the locations first")
        print_file = tempfile.mktemp(suffix='_locations.lbl')
        dls_cursor.execute("SELECT TRIM(UBIFNOMBRE), TRIM(UBIFDESCRIPCION), AGENCODIGO, MUF.TUBICODIGO \
            FROM MA_UBICACION_FISIC MUF, MA_TIPO_UBICACION MTU WHERE MUF.TUBICODIGO  in (9, 12)  \
            AND MUF.TUBICODIGO = MTU.TUBICODIGO")
        rows = dls_cursor.fetchall()
        for row in rows:
            ubifnombre, ubifdescripcion, agencodigo, tubicodigo = row
            if agencodigo != 1467:
                logger.info('Location %s is for a different CD. Skipping.', ubifnombre)
                continue
            location_object = Location.objects.filter(locn_id=ubifnombre)
            if location_object:
                logger.info('Location %s already exists. Skipping.' % ubifnombre)
                location_object = location_object[0]
                translate_dictionary = {'*dsp_locn': location_object.dsp_locn, '*locn_brcd': location_object.locn_brcd}
                translate_label(print_file, label_template_path, translate_dictionary)
            else:
                found_locn_brcd = False
                locn_brcd = None
                while not found_locn_brcd:
                    locn_brcd = ''.join(random.choices(string.ascii_letters + string.digits, k=10)).upper()
                    location_object = Location.objects.filter(locn_brcd=locn_brcd)
                    if location_object:
                        continue
                    else:
                        found_locn_brcd = True
                logger.info('Creating the Location %s with Barcode %s' % (ubifnombre, locn_brcd))
                if tubicodigo == 9:
                    location_object = Location(locn_id=ubifnombre,
                                                        location_type = rampa_location_type_object,
                                                        dsp_locn = ubifdescripcion,
                                                        locn_brcd = locn_brcd
                                                        )
                    location_object.save()
                elif tubicodigo == 12:
                    location_object = Location(locn_id=ubifnombre,
                                                        location_type = classification_location_type_object,
                                                        dsp_locn = ubifdescripcion,
                                                        locn_brcd = locn_brcd
                                                        )
                    location_object.save()
                translate_dictionary = {'*dsp_locn': ubifnombre, '*locn_brcd': locn_brcd}
                translate_label(print_file, label_template_path, translate_dictionary)


        logger.info("Done with the locations")
        logger.info("Now finding the transpaletas")
        label_template_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'starken_label_transpaletas.lbl')
        print_file = tempfile.mktemp(suffix='_transpaletas.lbl')
        dls_cursor.execute("SELECT TRIM(UBIFNOMBRE), TRIM(UBIFDESCRIPCION), AGENCODIGO, MUF.TUBICODIGO \
            FROM MA_UBICACION_FISIC MUF, MA_TIPO_UBICACION MTU WHERE MUF.TUBICODIGO  in (11)  \
            AND MUF.TUBICODIGO = MTU.TUBICODIGO")
        rows = dls_cursor.fetchall()
        logger.info("Done finding the transpaletas. Now processing %d entries" % (len(rows)))
        for row in rows:
            ubifnombre, ubifdescripcion, agencodigo, tubicodigo = row
            logger.info('Handling Transpaleta %s.' % ubifnombre)
            if agencodigo != 1467:
                logger.info('Transpaleta %s is for a different CD. Skipping.', ubifnombre)
                continue
            pallet_object = PalletJackMaster.objects.filter(pallet_jack_id=ubifnombre)
            if pallet_object:
                logger.info('Pallet %s already exists. Skipping.' % ubifnombre)
                pallet_object = pallet_object[0]
                translate_dictionary = {'*dsp_locn': pallet_object.pallet_jack_id, '*locn_brcd': pallet_object.pallet_jack_brcd}
                translate_label(print_file, label_template_path, translate_dictionary)
            else:
                found_pallet_jack_brcd = False
                pallet_jack_brcd = None
                while not found_pallet_jack_brcd:
                    pallet_jack_brcd = ''.join(random.choices(string.ascii_letters + string.digits, k=10)).upper()
                    pallet_object = PalletJackMaster.objects.filter(pallet_jack_brcd=pallet_jack_brcd)
                    if pallet_object:
                        continue
                    else:
                        found_pallet_jack_brcd = True
                logger.info('Creating the Pallet %s with Barcode %s' % (ubifnombre, pallet_jack_brcd))
                pallet_object = PalletJackMaster(pallet_jack_id = ubifnombre,
                                                        pallet_jack_brcd = pallet_jack_brcd
                                                        )
                pallet_object.save()
                translate_dictionary = {'*dsp_locn': ubifnombre, '*locn_brcd': pallet_jack_brcd}
                translate_label(print_file, label_template_path, translate_dictionary)
class Command(BaseCommand):
    help = 'Refrescar las ubicaciones'

    def handle(self, *args, **options):
        logger.info('*************** Starting the Refresh Location Process ***************')
        try:
            proc_start=datetime.now()
            refresh_locations()
            proc_end=datetime.now()
            logger.info('Total Process time : %d seconds' % (proc_end-proc_start).total_seconds())
            logger.info('************* Ending the Refresh Location Process ************')
        except Exception as e:
            error = traceback.format_exc()
            logger.error(error)