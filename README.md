
A full-stack orthodontics platform for managing aligner design orders, treatment plans, patients, invoices and more.

## Frontend

Built with React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query.

### Pages
- Products catalog with order form & Odontogram
- Orders with treatment plans & observations
- Invoices with detail view
- Users / Employees management
- Settings (General, Password, Billing, Delivery centers, Doctors, Notifications)
- Calendar with month & list view
- FAQ

### Run locally
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` in `frontend/.env` to point at the backend (see below).

## Backend

The backend lives in a separate repo: **[orthoflow-laravel](https://github.com/IZLAm90/orthoflow-laravel)**
(Laravel 12, Sanctum token auth). Clone it alongside this repo and follow its own README to
run it locally (defaults to `http://localhost:8001`).

## Mobile (Coming Soon)

React Native app for iOS and Android.

## Live Demo

Available via ngrok tunnel during development.
