from django.core.management.base import BaseCommand, CommandError
from datetime import datetime, timedelta
import sys, time, traceback, re
from cartonevents.models import *
from django.db import transaction
from django.db.models import Sum
import random, sys

class Command(BaseCommand):

    def fetch_data(self):
        try:
            import cx_Oracle
            loadcartoneventtype = LoadCartonEventType.objects.all()
            c=cx_Oracle.connect("LECLWMPROD/LECLWMPROD@//10.0.148.90:1526/LER6PROD")
            whse_object_dictionary = {}
            whse_objects = Warehouse.objects.all()
            for whse_object in whse_objects:
                whse_object_dictionary[whse_object.code] = whse_object
            cursor = c.cursor()
            print('Finding loads to work with...')
            cursor.execute("SELECT WHSE, LOAD_NBR FROM OUTBD_LOAD WHERE STAT_CODE=80")
            load_rows = cursor.fetchall()
            print('Done finding loads to work with')
            for load_row in load_rows:
                whse, load_nbr = load_row
                print('Working on load %s' % load_nbr)
                cursor.execute("SELECT carton_nbr, USER_ID FROM CARTON_HDR WHERE LOAD_NBR=:LOAD_NBR", {'LOAD_NBR': load_nbr})
                carton_rows = cursor.fetchall()
                print('Load %s has %d cartons' % (load_nbr,len(carton_rows)))
                for carton_row in carton_rows:
                    carton_nbr, user_id = carton_row
                    carton_event_object = LoadCartonEvents(whse_code = whse_object_dictionary[whse],
                                                           carton_nbr = carton_nbr,
                                                           load_nbr = load_nbr,
                                                           old_stat_code = 20,
                                                           new_stat_code = 20,
                                                           login_user_id = user_id,
                                                           load_carton_event_type = loadcartoneventtype[random.randint(0,len(loadcartoneventtype)-1)])
                    carton_event_object.save()
            transaction.commit()
        except Exception as e:
            self.stderr.write("Exception encountered in generate_invoicing_records")
            self.stderr.write(str(e))
            raise

    def add_arguments(self, parser):
        parser.add_argument("-d", "--debug", type=bool, default=True)
        parser.add_argument("-t", "--title", type=str)
        parser.add_argument("-c", "--cinema", type=str)

    def handle(self, *args, **options):
        try:
            self.stdout.write('------------ Starting the process -----------')
            start=datetime.now()

            self.fetch_data()

            end=datetime.now()
            time_taken=(end-start).total_seconds()
            self.stdout.write('------- Total Process Time : %d Seconds ------' %(int(time_taken)))
            sys.exit(0)
        except Exception as e:
            self.stderr.write(str(e))
            traceback.print_exc(file=sys.stdout)
