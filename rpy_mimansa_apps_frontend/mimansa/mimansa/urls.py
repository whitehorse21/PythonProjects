from django.contrib import admin
from django.urls import path, include, re_path
from django.conf.urls.static import static
from django.conf.urls import url
from django.conf import settings
from rest_framework import routers
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from packfromtote import views

# router = routers.SimpleRouter()
# router.register(r'api/warehouse', views.WarehouseViewSet, basename='Warehouse')
# router.register(r'api/locnprintermap', views.LocnPrinterMapViewSet, basename='LocnPrinterMap')

schema_view = get_schema_view(
   openapi.Info(
      title="Mimansa API",
      default_version='v1',
      description="Mimansa API",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

# urlpatterns = router.urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/warehouse/', views.WarehouseView.as_view(), name= 'warehouse_list'),
    path('api/locnprintermap/', views.LocnPrinterMapView.as_view(), name= 'locnprintermap_list'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)