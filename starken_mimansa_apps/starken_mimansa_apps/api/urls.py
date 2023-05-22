from django.urls import path
from api.views import login, get_user_details, tracking, get_pallet,\
    location, rampa_locate_shipment, shipment, classify_locate_shipment, build_pallet

urlpatterns = [
    path('login/', login, name='login'),
    path('get_user_details/', get_user_details, name='get_user_details'),
    path('tracking/', tracking, name='tracking'),
    path('get_pallet/', get_pallet, name='get_pallet'),
    path('build_pallet/', build_pallet, name='build_pallet'),
    path('rampa_locate_shipment/', rampa_locate_shipment,
         name='rampa_locate_shipment'),
    path('shipment/', shipment, name='shipment'),
    path('classify_locate_shipment/', classify_locate_shipment,
         name='classify_locate_shipment'),
    path('location/', location, name='location'),
]
