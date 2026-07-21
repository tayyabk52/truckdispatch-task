# Phase 0: Project Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a runnable Django + React monorepo for the Trip Planner & ELD Log Generator.

**Architecture:** Monorepo with `/backend` (Django + DRF) and `/frontend` (React + Vite + TypeScript). Single Supabase PostgreSQL database for all environments. Settings split by dev/prod for DEBUG, CORS, and allowed hosts — not for DB.

**Tech Stack:** Python 3.13, Django 5.x, DRF, django-cors-headers, dj-database-url, psycopg2-binary | Node 22, React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, MUI, TanStack Query, React Router, Axios, Leaflet.

## Global Constraints

- Python 3.13 via `python3` command (NOT `python` which is 3.9)
- Node 22.15 / npm 10.9
- All backend commands run from `F:/TruckDispatch/backend/`
- All frontend commands run from `F:/TruckDispatch/frontend/`
- Database: Supabase PostgreSQL via `DATABASE_URL` env var
- No SQLite — psycopg2-binary everywhere
- Django settings module: `config.settings.dev` for local work
- Vite dev server: port 5173; Django dev server: port 8000

---

### Task 1: Root Project Files

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`

**Interfaces:**
- Consumes: nothing
- Produces: root config files that all other tasks depend on for git hygiene

- [ ] **Step 1: Create .gitignore**

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
*.egg-info/
dist/
build/
.eggs/
*.egg
.venv/
venv/
env/

# Django
*.log
local_settings.py
db.sqlite3
media/
staticfiles/

# Environment
.env
.env.local
.env.*.local

# Node
node_modules/
frontend/dist/
frontend/.vite/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
desktop.ini

# PDF output cache
backend/media/logs/*.pdf
```

- [ ] **Step 2: Create .env.example**

```env
# === Backend ===
DJANGO_SECRET_KEY=change-me-to-a-random-string
DJANGO_SETTINGS_MODULE=config.settings.dev
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
ORS_API_KEY=your-openrouteservice-api-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

# === Frontend ===
VITE_API_BASE_URL=http://localhost:8000/api
```

- [ ] **Step 3: Create README.md**

```markdown
# Trip Planner & ELD Log Generator

A full-stack web app that generates FMCSA-compliant ELD (Electronic Logging Device) daily log sheets from trip inputs. Enter your origin, pickup, and drop-off locations — get a route with HOS-compliant breaks and printable Driver's Daily Log sheets.

## Tech Stack

- **Frontend:** React + Vite + TypeScript, Tailwind CSS + shadcn/ui, Leaflet maps
- **Backend:** Django + Django REST Framework, Python 3.13
- **Database:** Supabase (PostgreSQL)
- **Routing:** OpenRouteService API
- **Deployment:** Vercel (frontend) + Render (backend)

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt
cp ../.env.example .env         # Edit with your Supabase URL + ORS key
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local      # Edit API URL if needed
npm run dev
```

Open http://localhost:5173

## Project Structure

```
├── backend/          Django + DRF API
│   ├── config/       Project settings (base/dev/prod)
│   └── trips/        Main app (models, views, services)
├── frontend/         React + Vite SPA
│   └── src/
│       ├── api/      API client
│       ├── components/
│       ├── pages/
│       └── hooks/
└── docs/             Design specs and plans
```

## Environment Variables

See `.env.example` for all required variables.
```

- [ ] **Step 4: Commit**

```bash
git init
git add .gitignore .env.example README.md docs/
git commit -m "chore: init repo with root config files and docs"
```

---

### Task 2: Django Backend Scaffolding

**Files:**
- Create: `backend/config/__init__.py`
- Create: `backend/config/settings/__init__.py`
- Create: `backend/config/settings/base.py`
- Create: `backend/config/settings/dev.py`
- Create: `backend/config/settings/prod.py`
- Create: `backend/config/urls.py`
- Create: `backend/config/wsgi.py`
- Create: `backend/config/asgi.py`
- Create: `backend/manage.py`
- Create: `backend/requirements/base.txt`
- Create: `backend/requirements/dev.txt`
- Create: `backend/requirements/prod.txt`
- Create: `backend/.env.example`

**Interfaces:**
- Consumes: nothing
- Produces: runnable Django project with `python manage.py runserver`; DRF browsable API at `/api/`; CORS configured for frontend

- [ ] **Step 1: Create requirements files**

`backend/requirements/base.txt`:
```
Django>=5.1,<6.0
djangorestframework>=3.15,<4.0
django-cors-headers>=4.4,<5.0
python-dotenv>=1.0,<2.0
dj-database-url>=2.2,<3.0
psycopg2-binary>=2.9,<3.0
requests>=2.32,<3.0
```

`backend/requirements/dev.txt`:
```
-r base.txt
django-debug-toolbar>=4.4,<5.0
pytest>=8.0
pytest-django>=4.8
```

`backend/requirements/prod.txt`:
```
-r base.txt
gunicorn>=22.0,<23.0
whitenoise>=6.7,<7.0
weasyprint>=62.0,<63.0
```

- [ ] **Step 2: Create virtual environment and install deps**

Run from `F:/TruckDispatch/backend/`:
```bash
python3 -m venv .venv
source .venv/Scripts/activate
pip install -r requirements/dev.txt
```

Expected: all packages install successfully, Django 5.1+ available.

- [ ] **Step 3: Create config/settings/base.py**

```python
import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "insecure-dev-key-change-me")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    # Local
    "trips",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL", ""),
        conn_max_age=600,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

ORS_API_KEY = os.environ.get("ORS_API_KEY", "")
```

- [ ] **Step 4: Create config/settings/dev.py**

```python
from .base import *  # noqa: F401, F403

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

CORS_ALLOW_ALL_ORIGINS = True

INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405

MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")  # noqa: F405

INTERNAL_IPS = ["127.0.0.1"]
```

- [ ] **Step 5: Create config/settings/prod.py**

```python
import os

from .base import *  # noqa: F401, F403

DEBUG = False

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")

CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")

MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
```

- [ ] **Step 6: Create config/settings/__init__.py**

```python
```

(Empty file — settings module is selected via DJANGO_SETTINGS_MODULE env var.)

- [ ] **Step 7: Create config/__init__.py**

```python
```

- [ ] **Step 8: Create config/urls.py**

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("trips.urls")),
]
```

- [ ] **Step 9: Create config/wsgi.py**

```python
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

application = get_wsgi_application()
```

- [ ] **Step 10: Create config/asgi.py**

```python
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

application = get_asgi_application()
```

- [ ] **Step 11: Create manage.py**

```python
#!/usr/bin/env python
import os
import sys


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
```

- [ ] **Step 12: Create backend/.env.example**

```env
DJANGO_SECRET_KEY=change-me-to-a-random-string
DJANGO_SETTINGS_MODULE=config.settings.dev
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
ORS_API_KEY=your-openrouteservice-api-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

- [ ] **Step 13: Verify Django boots**

```bash
cd backend
source .venv/Scripts/activate
DJANGO_SETTINGS_MODULE=config.settings.dev python manage.py check
```

Expected: "System check identified no issues" (may warn about unapplied migrations — that's fine without DB connected).

- [ ] **Step 14: Commit**

```bash
git add backend/
git commit -m "feat: scaffold Django backend with settings split and DRF"
```

---

### Task 3: Trips App — Models

**Files:**
- Create: `backend/trips/__init__.py`
- Create: `backend/trips/apps.py`
- Create: `backend/trips/models/__init__.py`
- Create: `backend/trips/models/driver.py`
- Create: `backend/trips/models/vehicle.py`
- Create: `backend/trips/models/trip.py`
- Create: `backend/trips/models/route_stop.py`
- Create: `backend/trips/models/duty_status_event.py`
- Create: `backend/trips/models/daily_log.py`
- Create: `backend/trips/admin.py`
- Create: `backend/trips/urls.py`
- Create: `backend/trips/views/__init__.py`
- Create: `backend/trips/serializers/__init__.py`
- Create: `backend/trips/services/__init__.py`
- Create: `backend/trips/tests/__init__.py`

**Interfaces:**
- Consumes: Django config from Task 2
- Produces: All 6 models (Driver, Vehicle, Trip, RouteStop, DutyStatusEvent, DailyLog) registered in admin; `trips.urls` with an empty router; migrations generated

- [ ] **Step 1: Create trips/apps.py**

```python
from django.apps import AppConfig


class TripsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "trips"
```

- [ ] **Step 2: Create trips/__init__.py**

```python
```

- [ ] **Step 3: Create trips/models/driver.py**

```python
from django.db import models


class Driver(models.Model):
    name = models.CharField(max_length=200)
    license_number = models.CharField(max_length=50, blank=True, default="")
    carrier_name = models.CharField(max_length=200, blank=True, default="")
    carrier_main_office = models.CharField(max_length=300, blank=True, default="")
    home_terminal_tz = models.CharField(
        max_length=50,
        default="America/Chicago",
        help_text="IANA timezone, e.g. America/Chicago",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
```

- [ ] **Step 4: Create trips/models/vehicle.py**

```python
from django.db import models


class Vehicle(models.Model):
    truck_number = models.CharField(max_length=50)
    trailer_number = models.CharField(max_length=50, blank=True, default="")
    license_plate = models.CharField(max_length=20, blank=True, default="")
    license_state = models.CharField(max_length=2, blank=True, default="")

    def __str__(self):
        return f"Truck #{self.truck_number}"
```

- [ ] **Step 5: Create trips/models/trip.py**

```python
import uuid

from django.db import models


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    driver = models.ForeignKey(
        "trips.Driver", on_delete=models.SET_NULL, null=True, blank=True
    )
    vehicle = models.ForeignKey(
        "trips.Vehicle", on_delete=models.SET_NULL, null=True, blank=True
    )

    current_location_label = models.CharField(max_length=300)
    current_location_lat = models.FloatField()
    current_location_lng = models.FloatField()

    pickup_label = models.CharField(max_length=300)
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()

    dropoff_label = models.CharField(max_length=300)
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()

    current_cycle_used_hours = models.FloatField(
        help_text="Hours already used in the rolling 8-day cycle (0-70)"
    )
    start_datetime = models.DateTimeField()

    total_distance_miles = models.FloatField(null=True, blank=True)
    total_driving_minutes = models.IntegerField(null=True, blank=True)
    total_trip_minutes = models.IntegerField(null=True, blank=True)
    route_geometry = models.JSONField(
        null=True, blank=True, help_text="GeoJSON LineString or encoded polyline"
    )

    shipper_name = models.CharField(max_length=200, blank=True, default="")
    commodity = models.CharField(max_length=200, blank=True, default="")
    bol_number = models.CharField(max_length=100, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Trip {self.id} ({self.current_location_label} → {self.dropoff_label})"
```

- [ ] **Step 6: Create trips/models/route_stop.py**

```python
from django.db import models


class RouteStop(models.Model):
    class StopType(models.TextChoices):
        ORIGIN = "origin", "Origin"
        PICKUP = "pickup", "Pickup"
        DROPOFF = "dropoff", "Drop-off"
        FUEL = "fuel", "Fuel Stop"
        BREAK_30MIN = "break_30min", "30-Minute Break"
        REST_10HR = "rest_10hr", "10-Hour Rest"
        RESTART_34HR = "restart_34hr", "34-Hour Restart"
        POST_TRIP = "post_trip", "Post-Trip"

    trip = models.ForeignKey(
        "trips.Trip", on_delete=models.CASCADE, related_name="stops"
    )
    sequence = models.IntegerField()
    stop_type = models.CharField(max_length=20, choices=StopType.choices)
    label = models.CharField(max_length=300)
    lat = models.FloatField()
    lng = models.FloatField()
    arrival_time = models.DateTimeField()
    departure_time = models.DateTimeField()
    duration_minutes = models.IntegerField()
    cumulative_miles = models.FloatField(default=0)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["trip", "sequence"]

    def __str__(self):
        return f"{self.get_stop_type_display()} @ {self.label}"
```

- [ ] **Step 7: Create trips/models/duty_status_event.py**

```python
from django.db import models


class DutyStatusEvent(models.Model):
    class Status(models.TextChoices):
        OFF_DUTY = "off_duty", "Off Duty"
        SLEEPER_BERTH = "sleeper_berth", "Sleeper Berth"
        DRIVING = "driving", "Driving"
        ON_DUTY_NOT_DRIVING = "on_duty_not_driving", "On Duty (Not Driving)"

    trip = models.ForeignKey(
        "trips.Trip", on_delete=models.CASCADE, related_name="duty_events"
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=25, choices=Status.choices)
    location_label = models.CharField(max_length=300)
    lat = models.FloatField()
    lng = models.FloatField()
    remark = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["trip", "start_time"]

    def __str__(self):
        return f"{self.get_status_display()} ({self.start_time} → {self.end_time})"
```

- [ ] **Step 8: Create trips/models/daily_log.py**

```python
from django.db import models


class DailyLog(models.Model):
    trip = models.ForeignKey(
        "trips.Trip", on_delete=models.CASCADE, related_name="daily_logs"
    )
    log_date = models.DateField(help_text="Date in home-terminal timezone")
    total_miles_driving_today = models.IntegerField(default=0)
    total_off_duty = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    total_sleeper_berth = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    total_driving = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    total_on_duty_not_driving = models.DecimalField(
        max_digits=4, decimal_places=2, default=0
    )
    shipping_doc_number = models.CharField(max_length=100, blank=True, default="")
    driver_signature = models.CharField(max_length=200, blank=True, default="")
    generated_svg = models.TextField(blank=True, default="")
    generated_pdf = models.FileField(upload_to="logs/", blank=True, null=True)

    class Meta:
        ordering = ["trip", "log_date"]
        unique_together = ["trip", "log_date"]

    def __str__(self):
        return f"Log {self.log_date} for Trip {self.trip_id}"
```

- [ ] **Step 9: Create trips/models/__init__.py**

```python
from .daily_log import DailyLog
from .driver import Driver
from .duty_status_event import DutyStatusEvent
from .route_stop import RouteStop
from .trip import Trip
from .vehicle import Vehicle

__all__ = [
    "Driver",
    "Vehicle",
    "Trip",
    "RouteStop",
    "DutyStatusEvent",
    "DailyLog",
]
```

- [ ] **Step 10: Create trips/admin.py**

```python
from django.contrib import admin

from .models import DailyLog, Driver, DutyStatusEvent, RouteStop, Trip, Vehicle


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ["name", "carrier_name", "home_terminal_tz", "created_at"]


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ["truck_number", "trailer_number", "license_plate", "license_state"]


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "current_location_label",
        "pickup_label",
        "dropoff_label",
        "total_distance_miles",
        "created_at",
    ]
    list_filter = ["created_at"]


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ["trip", "sequence", "stop_type", "label", "arrival_time"]
    list_filter = ["stop_type"]


@admin.register(DutyStatusEvent)
class DutyStatusEventAdmin(admin.ModelAdmin):
    list_display = ["trip", "status", "start_time", "end_time", "location_label"]
    list_filter = ["status"]


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = [
        "trip",
        "log_date",
        "total_driving",
        "total_on_duty_not_driving",
        "total_off_duty",
        "total_sleeper_berth",
    ]
```

- [ ] **Step 11: Create trips/urls.py**

```python
from django.urls import path

urlpatterns = []
```

- [ ] **Step 12: Create stub directories**

```python
# backend/trips/views/__init__.py
# backend/trips/serializers/__init__.py
# backend/trips/services/__init__.py
# backend/trips/tests/__init__.py
```

All empty `__init__.py` files.

- [ ] **Step 13: Generate migrations**

```bash
cd backend
source .venv/Scripts/activate
python manage.py makemigrations trips
```

Expected: migration file `trips/migrations/0001_initial.py` created with all 6 models.

- [ ] **Step 14: Verify migrations**

```bash
python manage.py check
python manage.py showmigrations
```

Expected: `trips` shows `[ ] 0001_initial` (unapplied is OK — Supabase connection needed to apply).

- [ ] **Step 15: Commit**

```bash
git add backend/trips/
git commit -m "feat: add trips app with all models, admin, and migrations"
```

---

### Task 4: React Frontend Scaffolding

**Files:**
- Create: `frontend/` (Vite scaffold)
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/trips.ts`
- Create: `frontend/src/types/trip.ts`
- Create: `frontend/src/pages/HomePage.tsx`
- Create: `frontend/src/pages/TripResultsPage.tsx`
- Create: `frontend/src/pages/LogViewerPage.tsx`
- Create: `frontend/src/pages/HistoryPage.tsx`
- Create: `frontend/src/pages/AboutPage.tsx`
- Create: `frontend/src/pages/NotFoundPage.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/.env.example`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/tsconfig.json`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: nothing
- Produces: runnable React app at localhost:5173 with all routes, API client configured, Tailwind + shadcn/ui ready, Leaflet importable, TanStack Query provider mounted

- [ ] **Step 1: Scaffold Vite project**

```bash
cd F:/TruckDispatch
npm create vite@latest frontend -- --template react-ts
cd frontend
```

- [ ] **Step 2: Install core dependencies**

```bash
cd F:/TruckDispatch/frontend
npm install react-router-dom @tanstack/react-query axios leaflet react-leaflet
npm install -D @types/leaflet
```

- [ ] **Step 3: Install Tailwind CSS**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 4: Configure Tailwind in vite.config.ts**

Replace `frontend/vite.config.ts`:
```typescript
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
```

- [ ] **Step 5: Configure tsconfig.json paths**

Replace `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Replace src/index.css with Tailwind**

```css
@import "tailwindcss";
```

- [ ] **Step 7: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

This creates `components.json` and updates `tailwind.config.ts`.

- [ ] **Step 8: Install MUI (selective)**

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

- [ ] **Step 9: Create frontend/.env.example**

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

- [ ] **Step 10: Create src/types/trip.ts**

```typescript
export interface Driver {
  id: number;
  name: string;
  license_number: string;
  carrier_name: string;
  carrier_main_office: string;
  home_terminal_tz: string;
}

export interface Vehicle {
  id: number;
  truck_number: string;
  trailer_number: string;
  license_plate: string;
  license_state: string;
}

export type StopType =
  | "origin"
  | "pickup"
  | "dropoff"
  | "fuel"
  | "break_30min"
  | "rest_10hr"
  | "restart_34hr"
  | "post_trip";

export type DutyStatus =
  | "off_duty"
  | "sleeper_berth"
  | "driving"
  | "on_duty_not_driving";

export interface RouteStop {
  id: number;
  sequence: number;
  stop_type: StopType;
  label: string;
  lat: number;
  lng: number;
  arrival_time: string;
  departure_time: string;
  duration_minutes: number;
  cumulative_miles: number;
  notes: string;
}

export interface DutyStatusEvent {
  id: number;
  start_time: string;
  end_time: string;
  status: DutyStatus;
  location_label: string;
  lat: number;
  lng: number;
  remark: string;
}

export interface DailyLog {
  id: number;
  log_date: string;
  total_miles_driving_today: number;
  total_off_duty: number;
  total_sleeper_berth: number;
  total_driving: number;
  total_on_duty_not_driving: number;
  shipping_doc_number: string;
  generated_svg: string;
}

export interface Trip {
  id: string;
  current_location_label: string;
  current_location_lat: number;
  current_location_lng: number;
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_label: string;
  dropoff_lat: number;
  dropoff_lng: number;
  current_cycle_used_hours: number;
  start_datetime: string;
  total_distance_miles: number | null;
  total_driving_minutes: number | null;
  total_trip_minutes: number | null;
  route_geometry: object | null;
  shipper_name: string;
  commodity: string;
  bol_number: string;
  created_at: string;
  stops: RouteStop[];
  duty_events: DutyStatusEvent[];
  daily_logs: DailyLog[];
}

export interface TripCreatePayload {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hours: number;
  start_datetime?: string;
  driver_name?: string;
  carrier_name?: string;
  main_office?: string;
  truck_number?: string;
  trailer_number?: string;
  co_driver?: string;
  shipper_name?: string;
  commodity?: string;
  bol_number?: string;
}
```

- [ ] **Step 11: Create src/api/client.ts**

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
```

- [ ] **Step 12: Create src/api/trips.ts**

```typescript
import apiClient from "./client";
import type { Trip, TripCreatePayload } from "@/types/trip";

export async function createTrip(payload: TripCreatePayload): Promise<Trip> {
  const response = await apiClient.post<Trip>("/trips/", payload);
  return response.data;
}

export async function getTrip(id: string): Promise<Trip> {
  const response = await apiClient.get<Trip>(`/trips/${id}/`);
  return response.data;
}

export function getTripPdfUrl(id: string): string {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
  return `${baseUrl}/trips/${id}/logs.pdf`;
}
```

- [ ] **Step 13: Create page shells**

`src/pages/HomePage.tsx`:
```typescript
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Plan Your Trip</h1>
      <p className="mt-2 text-muted-foreground">
        Enter your trip details to generate compliant ELD logs.
      </p>
    </div>
  );
}
```

`src/pages/TripResultsPage.tsx`:
```typescript
import { useParams } from "react-router-dom";

export default function TripResultsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Trip Results</h1>
      <p className="mt-2 text-muted-foreground">Trip ID: {id}</p>
    </div>
  );
}
```

`src/pages/LogViewerPage.tsx`:
```typescript
import { useParams } from "react-router-dom";

export default function LogViewerPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Log Sheets</h1>
      <p className="mt-2 text-muted-foreground">Trip ID: {id}</p>
    </div>
  );
}
```

`src/pages/HistoryPage.tsx`:
```typescript
export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Recent Trips</h1>
      <p className="mt-2 text-muted-foreground">
        Your previously planned trips.
      </p>
    </div>
  );
}
```

`src/pages/AboutPage.tsx`:
```typescript
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">About HOS Rules</h1>
      <p className="mt-2 text-muted-foreground">
        Hours of Service regulations for property-carrying CMV drivers.
      </p>
    </div>
  );
}
```

`src/pages/NotFoundPage.tsx`:
```typescript
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">Trip not found.</p>
      <Link to="/" className="mt-6 inline-block text-primary underline">
        Start a new trip
      </Link>
    </div>
  );
}
```

- [ ] **Step 14: Create src/App.tsx**

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import AboutPage from "@/pages/AboutPage";
import HistoryPage from "@/pages/HistoryPage";
import HomePage from "@/pages/HomePage";
import LogViewerPage from "@/pages/LogViewerPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TripResultsPage from "@/pages/TripResultsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trips/:id" element={<TripResultsPage />} />
          <Route path="/trips/:id/logs" element={<LogViewerPage />} />
          <Route path="/trips/:id/logs/:date" element={<LogViewerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 15: Create src/main.tsx**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 16: Verify dev server starts**

```bash
cd F:/TruckDispatch/frontend
npm run dev
```

Expected: Vite dev server at http://localhost:5173, pages render without errors, routing works.

- [ ] **Step 17: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React frontend with routing, Tailwind, shadcn/ui, and API client"
```

---

### Task 5: Vercel + Render Deployment Config

**Files:**
- Create: `frontend/vercel.json`
- Create: `backend/Procfile`
- Create: `backend/runtime.txt`
- Create: `backend/build.sh`

**Interfaces:**
- Consumes: Django project (Task 2), React project (Task 4)
- Produces: deployment-ready config files for both platforms

- [ ] **Step 1: Create frontend/vercel.json**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Create backend/Procfile**

```
web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

- [ ] **Step 3: Create backend/runtime.txt**

```
python-3.13.3
```

- [ ] **Step 4: Create backend/build.sh**

```bash
#!/usr/bin/env bash
set -o errexit

pip install -r requirements/prod.txt
python manage.py collectstatic --noinput
python manage.py migrate
```

- [ ] **Step 5: Commit**

```bash
git add frontend/vercel.json backend/Procfile backend/runtime.txt backend/build.sh
git commit -m "chore: add Vercel and Render deployment config"
```

---

## Execution Order

Tasks 1 → 2 → 3 → 4 → 5 (sequential — each depends on prior).

## Verification Checklist

After all tasks complete:
- [ ] `cd backend && python manage.py check` passes
- [ ] `cd backend && python manage.py showmigrations` shows trips/0001_initial
- [ ] `cd frontend && npm run build` produces `dist/` with no TS errors
- [ ] `cd frontend && npm run dev` serves at localhost:5173
- [ ] All routes render (/, /trips/test-id, /history, /about, /nonexistent → 404)
- [ ] Git log shows 5 clean commits
