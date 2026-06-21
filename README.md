
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

## Backend

Built with FastAPI (Python), JWT authentication, in-memory store.

### Run locally
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## Mobile (Coming Soon)

React Native app for iOS and Android.

## Live Demo

Available via ngrok tunnel during development.
