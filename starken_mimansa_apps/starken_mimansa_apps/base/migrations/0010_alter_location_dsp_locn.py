# Generated by Django 4.1.2 on 2023-04-27 13:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0009_remove_shipment_final_desatch_ramp_location_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='location',
            name='dsp_locn',
            field=models.CharField(max_length=30, unique=True),
        ),
    ]
