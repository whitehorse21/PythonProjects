from rest_framework import serializers
from . import models
from rest_framework.fields import SerializerMethodField

class WarehouseSerializer(serializers.ModelSerializer):
    creation_date = SerializerMethodField()
    modification_date = SerializerMethodField()

    class Meta:
        model = models.Warehouse
        fields = '__all__'

    def get_creation_date(self, obj):
        return obj.creation_date.strftime("%Y-%m-%d %H:%M:%S")
    
    def get_modification_date(self, obj):
        return obj.modification_date.strftime("%Y-%m-%d %H:%M:%S")

class LoadCartonEventsSerializer(serializers.ModelSerializer):
    creation_date = SerializerMethodField()
    modification_date = SerializerMethodField()
    
    whse_name = serializers.ReadOnlyField(source='whse_code.name')
    load_carton_event_description = serializers.ReadOnlyField(source='load_carton_event_type.description')
    class Meta:
        model = models.LoadCartonEvents
        fields = '__all__'

    def get_creation_date(self, obj):
        return obj.creation_date.strftime("%Y-%m-%d %H:%M:%S")
    
    def get_modification_date(self, obj):
        return obj.modification_date.strftime("%Y-%m-%d %H:%M:%S")

   