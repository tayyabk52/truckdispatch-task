# Trip Planner & ELD Log Generator

A full-stack web app that generates FMCSA-compliant ELD (Electronic Logging Device) daily log sheets from trip inputs. Enter your origin, pickup, and drop-off locations — get a route with HOS-compliant breaks and printable Driver's Daily Log sheets.

## Tech Stack

- **Frontend:** React + Vite + TypeScript, Tailwind CSS + shadcn/ui, Leaflet maps
- **Backend:** Django + Django REST Framework, Python 3.13
- **Database:** Supabase (PostgreSQL)
- **Routing:** Google Maps Platform (Directions, Geocoding)
- **Deployment:** Vercel (frontend) + Render (backend)

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt
cp ../.env.example .env         # Edit with your Supabase URL + Google Maps key
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
