from django.shortcuts import render
from django.views.generic.list import ListView
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from .models import Location, PalletJackMaster, Shipment
from django.urls import reverse_lazy

def index(request):
    return render(request, 'index.html')

class LocationCreate(CreateView):
    model = Location
    fields = ['locn_id', 'dsp_locn', 'locn_brcd']

class LocationUpdate(UpdateView):
    model = Location
    fields = ['locn_id', 'dsp_locn', 'locn_brcd']

class LocationDelete(DeleteView):
    model = Location
    success_url = reverse_lazy('locn_list')

class LocationList(ListView):
    model = Location

    def get_queryset(self):
        pk = self.kwargs.get('locn_pk', None)
        if pk:
            queryset=Location.objects.filter(id = pk)
        else:
            queryset=Location.objects.all().order_by('dsp_locn')
        return queryset

class ShipmentList(ListView):
    model = Shipment

    def get_queryset(self):
        pk = self.kwargs.get('locn_pk', None)
        if pk:
            queryset=Shipment.objects.filter(id = pk)
        else:
            queryset=Shipment.objects.all().order_by('-create_date_time')
        return queryset

class PalletJackCreate(CreateView):
    model = PalletJackMaster
    fields = ['pallet_jack_id', 'pallet_jack_brcd']

class PalletJackUpdate(UpdateView):
    model = PalletJackMaster
    fields = ['pallet_jack_id', 'pallet_jack_brcd']

class PalletJackDelete(DeleteView):
    model = PalletJackMaster
    success_url = reverse_lazy('pallet_jack_list')

class PalletJackList(ListView):
    model = PalletJackMaster

    def get_queryset(self):
        queryset=PalletJackMaster.objects.all().order_by('pallet_jack_id')
        return queryset