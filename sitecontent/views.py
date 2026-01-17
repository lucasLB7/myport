from django.shortcuts import render
from django.http import JsonResponse

def home(request):
    # Later: load these from DB (SiteSettings, Project, etc.)
    ctx = {
        "brand": {
            "name": "Lucas Lambert",
            "tagline": "Builder of practical systems — business, RF, IoT, and software.",
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
                "link": "#",
            },
            {
                "title": "HAM Study App",
                "desc": "Quiz platform with images + Cloud SQL Postgres integration on GAE.",
                "tags": ["Django", "Postgres", "GCP"],
                "link": "#",
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
    ip = (
        request.META.get("HTTP_CF_CONNECTING_IP")
        or request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0]
        or request.META.get("REMOTE_ADDR")
    )
    return JsonResponse({"ip": ip})