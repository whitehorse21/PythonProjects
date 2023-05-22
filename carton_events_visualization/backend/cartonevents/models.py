from django.db import models

# Create your models here.
class DescriptionLookup(models.Model):
    def value(self):
        return self.id

    description = models.CharField(max_length=255, db_column='description')

    def __unicode__(self):
        return self.description

    class Meta:
        abstract = True

class LoadCartonEventType(DescriptionLookup):
    ASSIGNED_TO_ANOTHER_LOAD='ASSIGNED_TO_ANOTHER_LOAD'
    INVALID_STAT_CODE='INVALID_STAT_CODE'
    CARTON_LOCKED='CARTON_LOCKED'
    CARTON_CANCELED='CARTON_CANCELLED'
    CARTON_ALREADY_LOADED='CARTON_ALREADY_LOADED'

    code = models.CharField(max_length=50, primary_key=True)
    def __unicode__(self):
        return unicode(_(self.description))

    class Meta:
        db_table = 'load_carton_event_type'
        verbose_name = 'Load Carton Event Type'
        verbose_name_plural = 'Load Carton Event Type'
        unique_together = ()


class Warehouse(models.Model):
    code = models.CharField(max_length=10, db_index=True, primary_key=True)
    name = models.CharField(max_length=100)
    rut = models.CharField(max_length=12, verbose_name='RUT', null=True, blank=True)
    addr_line_1 = models.CharField(max_length=40)
    addr_line_2 = models.CharField(max_length=30,null=True,blank=True)
    locality = models.CharField(max_length=20,null=True,blank=True)
    city = models.CharField(max_length=20,null=True,blank=True)
    state = models.CharField(max_length=20,null=True,blank=True)
    zipcode = models.CharField(max_length=20, null=True,blank=True)
    phone = models.CharField(max_length=20, null=True,blank=True)
    creation_date = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creacion')
    modification_date = models.DateTimeField(auto_now=True, verbose_name='Fecha Modificacion')

    def __str__(self):
        return self.code + '-' + self.name

    class Meta:
        db_table='warehouse'
        verbose_name = "Warehouse"
        verbose_name_plural = "Warehouses"
        ordering = ['code']

class LoadCartonEvents(models.Model):
    whse_code = models.ForeignKey(Warehouse, db_column='whse_code', on_delete=models.RESTRICT)
    carton_nbr = models.CharField(max_length=20, db_index=True)
    load_nbr = models.CharField(max_length=20, db_index=True)
    load_carton_event_type = models.ForeignKey(LoadCartonEventType, null=False, db_column='load_carton_event_type', on_delete=models.RESTRICT)
    login_user_id = models.CharField(max_length=15)
    creation_date = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creacion')
    modification_date = models.DateTimeField(auto_now=True, verbose_name='Fecha Modificacion')

    def __str__(self):
        return self.whse_code.code + '-' + self.carton_nbr + self.load_nbr

    class Meta:
        db_table='load_carton_events'
        verbose_name = "Load Carton Event"
        verbose_name_plural = "Load Carton Events"
        ordering = ['creation_date']
