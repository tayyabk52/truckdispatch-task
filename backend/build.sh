#!/usr/bin/env bash
set -o errexit

# Explicitly force production settings for this build script.
# DO App Platform env vars may not be injected into the custom build subshell.
export DJANGO_SETTINGS_MODULE=config.settings.prod

pip install -r requirements/prod.txt
python manage.py collectstatic --noinput
python manage.py migrate
