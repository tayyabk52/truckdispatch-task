# Project Setup Design — Trip Planner & ELD Log Generator

**Date:** 2026-07-21
**Phase:** 0 — Initial Scaffolding
**Status:** Approved

---

## Decisions

| Decision | Choice |
|---|---|
| Frontend framework | React + Vite + TypeScript |
| UI libraries | Tailwind CSS + shadcn/ui (primary), MUI (selective for dashboard) |
| State management | TanStack Query + React Context |
| Backend framework | Django 5.x + Django REST Framework |
| Python package manager | pip + venv |
| Database | Supabase PostgreSQL (same instance for dev and prod) |
| Maps | Leaflet + OpenStreetMap tiles (display), OpenRouteService (routing/geocoding) |
| Frontend deployment | Vercel |
| Backend deployment | Render |

---

## Architecture

```
F:\TruckDispatch\
├── backend/                  ← Django + DRF (deployed to Render)
├── frontend/                 ← React + Vite (deployed to Vercel)
├── docs/                     ← Specs, design docs
├── .gitignore
├── README.md
└── .env.example
```

### Backend Structure

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py           ← Shared: installed apps, middleware, Supabase DB
│   │   ├── dev.py            ← DEBUG=True, CORS permissive
│   │   └── prod.py           ← DEBUG=False, restricted hosts/CORS
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── trips/
│   ├── models/               ← Driver, Vehicle, Trip, RouteStop, DutyStatusEvent, DailyLog
│   ├── serializers/
│   ├── views/
│   ├── services/             ← geocoding, routing, hos_planner, log_renderer
│   ├── urls.py
│   ├── admin.py
│   └── tests/
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
└── .env.example
```

### Frontend Structure

```
frontend/
├── src/
│   ├── api/                  ← Axios client + trip API functions
│   ├── components/
│   │   ├── ui/               ← shadcn/ui primitives
│   │   ├── map/              ← Leaflet map components
│   │   ├── log-sheet/        ← SVG log viewer
│   │   └── trip/             ← Trip form, summary, timeline
│   ├── pages/                ← Route-level page components
│   ├── hooks/                ← TanStack Query hooks
│   ├── lib/                  ← Utilities
│   ├── types/                ← TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tailwind.config.ts
├── vite.config.ts
├── components.json
├── package.json
└── index.html
```

---

## Database

Single Supabase PostgreSQL instance. Connection via `DATABASE_URL` environment variable in both dev and prod. Django uses `dj-database-url` to parse it.

---

## Environment Variables

```env
# Backend
DJANGO_SECRET_KEY=<generated>
DJANGO_SETTINGS_MODULE=config.settings.dev
DATABASE_URL=postgresql://user:pass@host:port/dbname
ORS_API_KEY=<openrouteservice-free-key>
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Key Packages

### Backend (requirements/base.txt)
- Django>=5.0
- djangorestframework
- django-cors-headers
- python-dotenv
- dj-database-url
- psycopg2-binary
- requests
- gunicorn
- whitenoise
- weasyprint (PDF generation, prod.txt)

### Frontend (package.json)
- react, react-dom, react-router-dom
- @tanstack/react-query
- axios
- leaflet, react-leaflet, @types/leaflet
- tailwindcss, postcss, autoprefixer
- @mui/material, @mui/icons-material, @emotion/react, @emotion/styled
- class-variance-authority, clsx, tailwind-merge (shadcn/ui deps)

---

## Deployment Config

### Vercel (frontend)
- Framework: Vite
- Build: `npm run build` → `dist/`
- Rewrites: all routes → `/index.html` (SPA)

### Render (backend)
- Build: `pip install -r requirements/prod.txt`
- Start: `gunicorn config.wsgi:application`
- Environment: DATABASE_URL, DJANGO_SECRET_KEY, ORS_API_KEY, etc.

---

## What This Phase Delivers

- Both projects scaffolded and runnable locally
- Django dev server serves API at localhost:8000
- Vite dev server serves frontend at localhost:5173
- Database models defined (migrations created but not applied until Supabase is connected)
- Router + page shells in React (empty pages, correct routing)
- API client configured with base URL from env
- Git-ready with proper .gitignore
