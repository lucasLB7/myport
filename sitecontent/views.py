from django.shortcuts import render
from django.http import JsonResponse

try:
    # Requires GeoIP2 + GeoLite2 DB configured
    from django.contrib.gis.geoip2 import GeoIP2
except Exception:
    GeoIP2 = None


def home(request):
    ctx = {
        "brand": {
            "name": "Lucas Lambert",
            "tagline": "Strategy, systems, and execution that ship.",
            "location": "Nairobi, Kenya",
        },
        "cta": {
            "primary_text": "View Projects",
            "primary_href": "#projects",
            "secondary_text": "Contact Me",
            "secondary_href": "#contact",
        },
        "highlights": [
            {"title": "Full-stack builds", "text": "Django, Flask, Postgres, clean deploys."},
            {"title": "RF + Maker", "text": "Antennas, SDR, LoRa nodes, embedded systems."},
            {"title": "Business pragmatist", "text": "Strategy, ops, and execution that ships."},
        ],
        "projects": [
            {
                "title": "EagleVision (ALPR recovery)",
                "desc": "Multi-frame tracking + rectification + probabilistic OCR for Kenyan plates.",
                "tags": ["Python", "OpenCV", "OCR"],
                "link": "",
            },
            {
                "title": "HAM Study App",
                "desc": "Quiz platform with images + Cloud SQL Postgres integration on GAE.",
                "tags": ["RSK", "HAM radio", "Kenya Radio Society"],
                "link": "https://rsk-ham-study.appspot.com/",
            },
            {
                "title": "GPS Telemetry System",
                "desc": "ESP8266 → Flask backend → map UI, built for battery-aware tracking.",
                "tags": ["ESP8266", "Flask", "Maps"],
                "link": "#",
            },
        ],
        "services": [
            {"title": "Web & automation", "text": "Internal tools, dashboards, workflow automation."},
            {"title": "Embedded prototypes", "text": "ESP32/ESP8266 builds, sensors, field-ready packaging."},
            {"title": "Technical strategy", "text": "Architecture + tradeoffs + roadmap planning."},
        ],
    }
    return render(request, "home.html", ctx)


def visitor_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    xri = request.META.get("HTTP_X_REAL_IP")
    remote = request.META.get("REMOTE_ADDR")

    if xff:
        ip = xff.split(",")[0].strip()
    elif xri:
        ip = xri.strip()
    else:
        ip = remote

    return JsonResponse({"ip": ip})

def geoip_lookup(request):
    # pick the IP the same way you likely did before
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    ip = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")

    country = "unknown location"
    if ip:
        try:
            country = GeoIP2().country(ip).get("country_name") or country
        except Exception:
            pass

    return JsonResponse({"ip": ip, "country": country})