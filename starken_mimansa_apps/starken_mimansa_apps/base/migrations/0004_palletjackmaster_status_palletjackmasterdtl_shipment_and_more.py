# Generated by Django 4.1.2 on 2022-11-09 22:19

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0003_palletjackmaster_pallet_jack_brcd_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='palletjackmaster',
            name='status',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='palletjackmasterdtl',
            name='shipment',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='base.shipment'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='palletjackmasterdtl',
            name='pallet_jack',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pallet_detail_records', to='base.palletjackmaster'),
        ),
    ]