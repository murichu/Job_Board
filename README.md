# Job Portal Final

Full-stack MERN Job Portal with React + Node.js/Express.

## Features
- Job browsing and search
- User & Company authentication
- Job posting and applications
- M-Pesa & Paystack payments
- Admin dashboard

## Tech Stack
- Frontend: React 18, Vite, Tailwind
- Backend: Node/Express, MongoDB
- State: Zustand + TanStack Query

## Development
```bash
cd client && npm install && npm run dev
cd server && npm install && npm run dev
```

Refactored on `dev` branch with improved state management.

A request-ID middleware (e.g. uuid + x-request-id header) threaded into AuditLog/FinancialAuditLog writes, and actually calling AuditLog.create from key actions.