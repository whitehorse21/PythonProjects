# -*- coding: utf-8 -*-
from datetime import timedelta, datetime
import logging
import os
import sys
import traceback
import hashlib

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q

from base.models import *
from fpdf import FPDF

from logging import FileHandler
project_root=os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__))))
logHandler = FileHandler(os.path.join(settings.BASE_DIR,'logs/generate_pdf_test_data_%s'%(datetime.now().strftime('%d.%m.%Y.log'))), 'a', encoding='UTF8')
logFormatter = logging.Formatter('%(levelname)s : %(asctime)s : %(process)d : %(message)s','%d/%m/%Y %I:%M:%S %p')
logHandler.setFormatter(logFormatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

def generate_pdf():

    counter = 0

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    y = 0
    counter = 0
    for location in Location.objects.all().order_by('dsp_locn'):
        if '_' in location.locn_brcd:
            continue

        if counter%10==0:
            y = 0
            pdf.add_page()

        if counter % 2 == 0:
            x = pdf.epw/4
            y = y + 50
        else:
            x = pdf.epw*2/3
        pdf.set_xy(x, y)
        pdf.code39('%s%s%s' % ('*', str(location.locn_brcd), '*'), x, y, w=1, h=15)
        pdf.set_font("Arial", size=10, style="B")
        pdf.set_xy(x+30, y+15)
        pdf.cell(w=1, h=10, txt = str(location.dsp_locn), align="C")
        counter += 1
    pdf.output("PDF_Locations.pdf")

    counter = 0

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    y = 0
    counter = 0
    for pallet_jack_master in PalletJackMaster.objects.all():

        if counter%10==0:
            y = 0
            pdf.add_page()

        if counter % 2 == 0:
            x = pdf.epw/4
            y = y + 50
        else:
            x = pdf.epw*2/3
        pdf.set_xy(x, y)
        pdf.code39('%s%s%s' % ('*', str(pallet_jack_master.pallet_jack_brcd), '*'), x, y, w=1, h=15)
        pdf.set_font("Arial", size=10, style="B")
        pdf.set_xy(x+30, y+15)
        pdf.cell(w=1, h=10, txt = str(pallet_jack_master.pallet_jack_id), align="C")
        counter += 1
    pdf.output("PDF_traspaletas.pdf")


class Command(BaseCommand):
    help = 'Generate Test Data'

    def handle(self, *args, **options):
        logger.info('*************** Starting the Test Data Generation Process ***************')
        try:
            proc_start=datetime.now()
            generate_pdf()
            proc_end=datetime.now()
            logger.info('Total Process time : %d seconds' % (proc_end-proc_start).total_seconds())
            logger.info('************* Ending the Test Data Generation Process ************')
        except Exception as e:
            error = traceback.format_exc()
            logger.error(error)