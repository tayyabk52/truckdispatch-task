import os

from django.core.wsgi import get_wsgi_application

# Server entrypoint defaults to production settings. Local development uses
# manage.py (which defaults to config.settings.dev). An explicit
# DJANGO_SETTINGS_MODULE env var always overrides this default.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

application = get_wsgi_application()
