"""starken_mimansa_apps URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf.urls import include
from base.views import LocationCreate, LocationUpdate, LocationDelete, ShipmentList, LocationList, index, PalletJackCreate, PalletJackUpdate, PalletJackDelete, PalletJackList
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="Starken Mimansa API",
        default_version='v1',
        description="Starken Mimansa API",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('swagger/', schema_view.with_ui('swagger',
         cache_timeout=0), name='schema-swagger-ui'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', index, name='index'),
    path('locn_create', LocationCreate.as_view(), name='locn_create'),
    path('locn_edit', LocationUpdate.as_view(), name='locn_edit'),
    path('locn_delete', LocationDelete.as_view(), name='locn_delete'),
    path('locn_list', LocationList.as_view(), name='locn_list'),
    path('shipment_list', ShipmentList.as_view(), name='shipment_list'),
    path('pallet_jack_create', PalletJackCreate.as_view(),
         name='pallet_jack_create'),
    path('pallet_jack_edit', PalletJackUpdate.as_view(), name='pallet_jack_edit'),
    path('pallet_jack_delete', PalletJackDelete.as_view(),
         name='pallet_jack_delete'),
    path('pallet_jack_list', PalletJackList.as_view(), name='pallet_jack_list'),
]
