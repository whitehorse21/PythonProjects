import json
import django

from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http.response import HttpResponse
# from django.contrib.auth.models import User
from django.db.models import Q
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.views.generic import CreateView, TemplateView

from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from . import models, serializers
from rest_framework.decorators import api_view
from django import core
from datetime import datetime
import pytz
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import Group
from django.forms.models import model_to_dict
from collections import OrderedDict

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from .models import Warehouse, LocnPrinterMap
from .serializers import WarehouseSerializer, LocnPrinterMapSerializer
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Warehouse



def handle_uploaded_file(f):
    with open('1.png', 'wb+') as destination:
        for chunk in f.chunks():
            destination.write(chunk)
class WarehouseView(APIView):
    def put(self, request, format=None):
        pre_code=request.GET.get("code")
        data = request.data

        if pre_code != data["code"]:
            if len(Warehouse.objects.filter(code=data["code"])) > 0:
                return HttpResponse(status=status.HTTP_409_CONFLICT)

        instance = Warehouse.objects.get(code=data["code"])
        try:
            instance.logo = request.FILES['logo']
            instance.save()
        except:
            pass
        
        try:
            Warehouse.objects.filter(code=pre_code).update(code = data["code"], name = data["name"], rut = data["rut"], addr_line_1 = data["addr_line_1"], addr_line_2 = data["addr_line_2"], locality = data["locality"], city = data["city"], state = data["state"], zipcode = data["zipcode"], phone = data["phone"])
            return HttpResponse(status=status.HTTP_200_OK)
        except:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, format=None):
        try:
            Warehouse.objects.filter(code=request.GET.get("code")).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as err:
            return HttpResponse (err, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            


    def get(self, request, *args, **kwargs):
        if "code" in request.GET:
            data = Warehouse.objects.filter(code=request.GET.get("code"))
        else:
            data = Warehouse.objects.all()
        serializer = WarehouseSerializer(data, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        data = request.data
        data["logo"] = request.FILES['logo']

        warehouse_serializer = WarehouseSerializer(data=data)
        code = request.data["code"]

        if len(Warehouse.objects.filter(code=code)) > 0:
            return HttpResponse(status=status.HTTP_409_CONFLICT)
        
        if warehouse_serializer.is_valid():
            warehouse_serializer.save()
            return HttpResponse (WarehouseSerializer.data)
        else:
            print('error', WarehouseSerializer.errors)
            return HttpResponse (WarehouseSerializer.errors, status=status.HTTP_400_BAD_REQUEST)

    


class LocnPrinterMapView(APIView):
    def put(self, request, format=None):
        data = request.data

        try:
            LocnPrinterMap.objects.filter(id=request.GET.get("id")).update(whse_code = data["whse_code"], reserve_locn = data["reserve_locn"], staging_locn = data["staging_locn"], printer_name = data["printer_name"])
            return HttpResponse(status=status.HTTP_200_OK)
        except:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, format=None):
        LocnPrinterMap.objects.filter(id=request.GET.get("id")).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get(self, request, *args, **kwargs):
        if "id" in request.GET:
            data = LocnPrinterMap.objects.filter(id=request.GET.get("id"))
        else:
            data = LocnPrinterMap.objects.all()
        serializer = LocnPrinterMapSerializer(data, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        locnprintermap_serializer = LocnPrinterMapSerializer(data=request.data)
        
        if locnprintermap_serializer.is_valid():
            locnprintermap_serializer.save()
            return HttpResponse (LocnPrinterMapSerializer.data)
        else:
            print('error', LocnPrinterMapSerializer.errors)
            return HttpResponse (LocnPrinterMapSerializer.errors, status=status.HTTP_400_BAD_REQUEST)


