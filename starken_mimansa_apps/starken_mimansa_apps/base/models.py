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

class LocationType(DescriptionLookup):
    CLASSIFICATION='C'
    RECEIVING='R'
    RAMPA='D'

    code = models.CharField(max_length=1, primary_key=True)
    def __unicode__(self):
        return unicode(_(self.description))

    class Meta:
        db_table = 'location_type'
        verbose_name = 'Location Type'
        verbose_name_plural = 'Location Type'
        unique_together = ()

class Shipment(models.Model):
    CREATED=0
    RECEIVED_PENDING_PUTAWAY=10
    CLASSIFIED=20
    ON_PALLET_PENDING_PUTAWAY=30
    PUTAWAY=50
    DESPATCHED=90

    shipment_nbr = models.CharField(max_length=30, unique=True)
    current_location = models.ForeignKey('Location', on_delete=models.CASCADE, related_name='all_shipments_current_location', null=True)
    final_despatch_ramp_location = models.ForeignKey('Location', on_delete=models.CASCADE, related_name='all_shipments_final_despatch_ramp_location', null=True)
    status = models.PositiveIntegerField(default=CREATED)
    pallet_jack = models.ForeignKey('PalletJackMaster', on_delete=models.CASCADE, related_name='all_shipments_pallet_jack', null=True)
    received_at = models.DateTimeField(null=True)
    classified_at = models.DateTimeField(null=True)
    palletized_at = models.DateTimeField(null=True)
    located_at = models.DateTimeField(null=True)
    despatched_at = models.DateTimeField(null=True)
    received = models.BooleanField(default = False)
    classified = models.BooleanField(default = False)
    palletized = models.BooleanField(default = False)
    located = models.BooleanField(default = False)
    despatched = models.BooleanField(default = False)
    colour_code = models.CharField(max_length=30, null = True)
    colour_code_desc = models.CharField(max_length=30, null = True)
    create_date_time = models.DateTimeField(auto_now_add=True)
    mod_date_time = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Encargos"
        db_table='shipment'

class Location(models.Model):
    locn_id = models.CharField(max_length=10, unique=True)
    location_type = models.ForeignKey('LocationType', on_delete=models.CASCADE, related_name='location_type', null=True)
    dsp_locn = models.CharField(max_length=30, unique=True)
    locn_brcd = models.CharField(max_length=10, unique=True)
    create_date_time = models.DateTimeField(auto_now_add=True)
    mod_date_time = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["locn_brcd"]
        verbose_name_plural = "Locations"
        db_table='location'
        indexes = [
            models.Index(fields=['locn_brcd', 'locn_id']),
        ]

class PalletJackMaster(models.Model):
    EMPTY=0
    LOADING_IN_PROGRESS=10
    LOADED_PENDING_LOCATE=50
    UNLOADING_IN_PROGRESS=90
    pallet_jack_id = models.CharField(max_length=20, unique=True)
    pallet_jack_brcd = models.CharField(max_length=20, unique=True)
    status = models.PositiveIntegerField(default=EMPTY)
    create_date_time = models.DateTimeField(auto_now_add=True)
    mod_date_time = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["pallet_jack_id"]
        verbose_name_plural = "Transpaletas"
        db_table='pallet_jack_master'

class PalletJackMasterDtl(models.Model):
    pallet_jack = models.ForeignKey(PalletJackMaster, on_delete=models.CASCADE, related_name='pallet_detail_records')
    shipment = models.ForeignKey('Shipment', on_delete=models.CASCADE)
    create_date_time = models.DateTimeField(auto_now_add=True)
    mod_date_time = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Encargos de Transpaletas"
        db_table='pallet_jack_master_dtl'

