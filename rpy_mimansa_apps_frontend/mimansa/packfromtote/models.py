from django.db import models

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
    logo = models.ImageField(upload_to='', null=True,blank=True)
    creation_date = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creacion')
    modification_date = models.DateTimeField(auto_now=True, verbose_name='Fecha Modificacion')

    def __str__(self):
        return self.code + '-' + self.name

    class Meta:
        db_table='warehouse'
        verbose_name = "Warehouse"
        verbose_name_plural = "Warehouses"
        ordering = ['code']


class LocnPrinterMap(models.Model):
    PRINTER_MODE_CHOICES = [('DIRECT', 'DIRECT'), ('QUEUE', 'QUEUE'),]
    whse_code = models.ForeignKey(Warehouse, db_column='whse_code', on_delete=models.RESTRICT)
    reserve_locn = models.CharField(max_length=10)
    staging_locn = models.CharField(max_length=10)
    control_locn = models.CharField(max_length=10)
    printer_name = models.CharField(max_length=40)
    print_mode = models.CharField(max_length=10, choices=PRINTER_MODE_CHOICES)
    creation_date = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creacion')
    modification_date = models.DateTimeField(auto_now=True, verbose_name='Fecha Modificacion')

    def __str__(self):
        return self.whse_code.code + '-' + self.reserve_locn + self.staging_locn + self.printer_name

    class Meta:
        db_table='locn_printer_map'
        verbose_name = "Locn Printer Map"
        verbose_name_plural = "Locn Printer Map"
        ordering = ['whse_code']

        constraints = [
            models.UniqueConstraint(fields=['whse_code', 'reserve_locn'], name='unique_reserve_locn'),
            models.UniqueConstraint(fields=['reserve_locn', 'staging_locn'], name='unique_reserve_staging'),
            models.UniqueConstraint(fields=['reserve_locn', 'printer_name'], name='unique_reserve_locn_printer'),
        ]