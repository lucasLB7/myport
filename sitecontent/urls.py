from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("api/visitor-ip/", views.visitor_ip, name="visitor_ip"),
    path("geoip/", views.geoip_lookup, name="geoip_lookup"),
    path("api/gpt/", views.gpt_terminal, name="gpt_terminal"),
]
