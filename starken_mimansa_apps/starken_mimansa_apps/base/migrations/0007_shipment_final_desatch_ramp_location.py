# Generated by Django 4.1.2 on 2023-01-19 19:28

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0006_alter_shipment_current_location_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='shipment',
            name='final_desatch_ramp_location',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='all_shipments_final_desatch_ramp_location', to='base.location'),
        ),
    ]