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
from django.db.models import Q

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
from .models import Warehouse, LoadCartonEvents
from .serializers import WarehouseSerializer, LoadCartonEventsSerializer
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Warehouse
from rest_framework.pagination import PageNumberPagination
from .mypagination import MyPagination

from rest_framework.viewsets import ReadOnlyModelViewSet
from drf_excel.mixins import XLSXFileMixin
from drf_excel.renderers import XLSXRenderer
from rest_framework.renderers import JSONRenderer

class UsersView(APIView):
    def get(self, request, *args, **kwargs):
        return Response ({'success': True, 'whse': 'asdasd', 'whse_name': 'sdsd'})

class LoadCartonEventsView(APIView):
    pagination_class = MyPagination        

    def put(self, request, format=None):
        data = request.data

        try:
            LoadCartonEvents.objects.filter(id=request.GET.get("id")).update(whse_code = data["whse_code"], carton_nbr = data["carton_nbr"], load_nbr = data["load_nbr"], load_carton_event_type = data["load_carton_event_type"], old_stat_code = data["old_stat_code"], new_stat_code = data["new_stat_code"], login_user_id = data["login_user_id"])
            return HttpResponse(status=status.HTTP_200_OK)
        except:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, format=None):
        LoadCartonEvents.objects.filter(id=request.GET.get("id")).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def post(self, request, *args, **kwargs):
        loadcartonevents_serializer = LoadCartonEventsSerializer(data=request.data)
        
        if loadcartonevents_serializer.is_valid():
            loadcartonevents_serializer.save()
            return Response (loadcartonevents_serializer.data)
        else:
            print('error', LoadCartonEventsSerializer.errors)
            return HttpResponse (LoadCartonEventsSerializer.errors, status=status.HTTP_400_BAD_REQUEST)
            

    def get(self, request, *args, **kwargs):
        '''
        if "q" in request.GET:
            queryset = LoadCartonEvents.objects.filter(carton_nbr__contains=request.GET.get("q"))
        else:
            queryset = LoadCartonEvents.objects.all()
        
        queryset = queryset.order_by('-old_stat_code')
        '''

        if "sort" in request.GET:
            updatedSortField = request.GET.get('sort')
            if updatedSortField == 'whse_name' : 
                updatedSortField = 'whse_code__name'
            if updatedSortField == 'load_carton_event_description':
                updatedSortField = 'load_carton_event_type__description'

            queryset = LoadCartonEvents.objects.all().order_by(updatedSortField if request.GET.get("direction") == 'asc' else "-"+updatedSortField )
        else:
            queryset = LoadCartonEvents.objects.all().order_by('id')
        
        #queryset = queryset.prefetch_related('load_carton_event_type', 'load_carton_event_type__description')

        if "start_date" in request.GET:
            queryset = queryset.filter(creation_date__range=[request.GET.get('start_date'), request.GET.get('end_date')])

        if "q" in request.GET:
            queryset = queryset.filter(Q(carton_nbr__icontains=request.GET.get("q")) | Q(load_nbr__icontains=request.GET.get("q")) | Q(load_carton_event_type__description__icontains=request.GET.get("q")))

        if "export" in request.GET:
            queryset = queryset.select_related('whse_code').select_related('load_carton_event_type')[:100000]
            events = []
            for eachEvent in queryset:
                events.append({'whse_code': eachEvent.whse_code.code, 'carton_nbr': eachEvent.carton_nbr, 'load_nbr': eachEvent.load_nbr, 'load_carton_event_type': eachEvent.load_carton_event_type.code, 'login_user_id': eachEvent.login_user_id, 'creation_date': eachEvent.creation_date, 'modification_date': eachEvent.modification_date, 'whse_name': eachEvent.whse_code.name, 'load_carton_event_description': eachEvent.load_carton_event_type.description})

            return Response({'data': events, 'export': True})
        else:
            paginator = self.pagination_class()
            result_page = paginator.paginate_queryset(queryset, request) 
            #paginate_queryset method is used to paginate the queryset
            serializer = LoadCartonEventsSerializer(result_page, many=True)
            return paginator.get_paginated_response(serializer.data)        
