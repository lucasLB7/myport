from django.urls import path
from .views import home, visitor_ip

urlpatterns = [
    path("", home, name="home"),
    path("api/visitor-ip/", visitor_ip),
]

