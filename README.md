# Truck Dispatch & ELD Trip Planner

A full-stack web application designed for the trucking industry. It generates FMCSA-compliant ELD (Electronic Logging Device) daily log sheets based on trip inputs. Dispatchers can enter origin, pickup, and drop-off locations to automatically generate routes with HOS-compliant breaks, alongside print-ready Driver's Daily Log SVGs.

## 🚀 Tech Stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS + MUI / shadcn
- **Backend**: Django + Django REST Framework, Python 3.13
- **Database**: SQLite (local/demo) & PostgreSQL (production via Supabase)
- **Routing & Maps**: Google Maps Platform (Directions API, Geocoding API)
- **Deployment**: Vercel (Frontend) + DigitalOcean App Platform (Backend)

## 📦 Project Structure

```text
├── backend/          # Django + DRF API
│   ├── config/       # Settings configurations (base, dev, prod)
│   └── trips/        # Core business logic, models, and log generation
└── frontend/         # React + Vite SPA
    └── src/
        ├── api/      # API communication clients
        ├── components/
        └── pages/    # Main views (Plan Trip, Settings, History)
```

## 🛠️ Local Development Setup

### 1. Backend (Django)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt

# Configure environment variables
cp ../.env.example .env
# Important: Add your GOOGLE_MAPS_API_KEY inside the .env file

python manage.py migrate
python manage.py runserver
```

### 2. Frontend (React / Vite)
```bash
cd frontend
npm install

# Point the frontend to your local backend API
cp .env.example .env.local
# Ensure VITE_API_BASE_URL=http://localhost:8000/api is set

npm run dev
```

Navigate to `[http://localhost:5173](https://truckdispatch-task.vercel.app/)` to view the application.

## 🌐 Production Deployment

This project is configured for seamless deployment:
- **Frontend (Vercel)**: Connect the GitHub repository to Vercel and set `VITE_API_BASE_URL` to your live DigitalOcean backend endpoint.
- **Backend (DigitalOcean App Platform)**: Deploy the backend directory using the Python Buildpack. Ensure the following environment variables are set:
  - `DJANGO_SETTINGS_MODULE=config.settings.prod`
  - `DISABLE_COLLECTSTATIC=1`
  - `CORS_ALLOWED_ORIGINS=https://your-vercel-frontend-url.vercel.app`
  - `GOOGLE_MAPS_API_KEY=your_key`

## 🔑 Environment Variables
See `backend/.env.example` and `frontend/.env.example` for a complete list of required environment variables.
