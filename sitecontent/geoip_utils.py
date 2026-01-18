import os
from functools import lru_cache

from django.conf import settings
import geoip2.database
import geoip2.errors

GEOIP_DB_PATH = os.path.join(
    settings.BASE_DIR, "geoip", "GeoLite2-Country.mmdb"
)

_reader = None


def _get_reader():
    global _reader
    if _reader is None:
        _reader = geoip2.database.Reader(GEOIP_DB_PATH)
    return _reader


def get_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()

    xri = request.META.get("HTTP_X_REAL_IP")
    if xri:
        return xri.strip()

    return request.META.get("REMOTE_ADDR")


@lru_cache(maxsize=50000)
def country_from_ip(ip: str):
    if not ip or ip in ("127.0.0.1", "::1"):
        return {"country_code": "XX", "country_name": "Unknown"}

    try:
        resp = _get_reader().country(ip)
        return {
            "country_code": resp.country.iso_code or "XX",
            "country_name": resp.country.name or "Unknown",
        }
    except (geoip2.errors.AddressNotFoundError, ValueError):
        return {"country_code": "XX", "country_name": "Unknown"}
    except Exception:
        return {"country_code": "XX", "country_name": "Unknown"}
