import os

from .base import *  # noqa: F401, F403

DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1", "t")

allowed_hosts_env = os.environ.get("ALLOWED_HOSTS", "").strip()
if allowed_hosts_env and allowed_hosts_env != "*":
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(",") if h.strip()]
else:
    ALLOWED_HOSTS = ["*"]

cors_origins_env = os.environ.get("CORS_ALLOWED_ORIGINS", "").strip()
if cors_origins_env and cors_origins_env != "*":
    CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    CORS_ALLOW_ALL_ORIGINS = True

MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
