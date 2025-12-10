# Real Vista Project

A lightweight full-stack web project with a React + Vite frontend (`client`) and an Express + Mongoose backend (`server`). This README explains how to get the project running locally, environment variables, and useful scripts.

**Repository Structure**
- `client/` — React frontend built with Vite.
- `server/` — Express backend (MongoDB via Mongoose).

**Tech stack**
- Frontend: React, Vite
- Backend: Node.js, Express, Mongoose
- Dev tooling: nodemon (server), Vite (client)

**Prerequisites**
- Node.js v18+ and npm installed
- (Optional) MongoDB running locally or a cloud MongoDB URI

**Environment**
- The frontend uses Vite environment variables prefixed with `VITE_` (for example `VITE_API_BASE`).
- The backend uses a `.env` file (loaded by `dotenv`) — create a `.env` in `server/` with the variables described below.

**Backend `.env` (example)**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/realvista
# Optional admin credentials used by the client demo (not secure for production)
ADMIN_ID=admin
ADMIN_PASS=admin123
```

How to run

- Install dependencies for both projects and start them locally.

1) Start the server

```powershell
cd 'C:\Users\kushw\Desktop\Real Vista Project\server'
npm install
# Start in development with autoreload
npm run dev
# Or run in production mode
npm start
```

2) Start the client

```powershell
cd 'C:\Users\kushw\Desktop\Real Vista Project\client'
npm install
npm run dev
```

Notes
- The frontend expects an API base URL configured via `VITE_API_BASE`. By default it will use `http://localhost:5000`.
- The admin demo in the frontend uses `VITE_ADMIN_ID` and `VITE_ADMIN_PASS` if provided, otherwise defaults in the client code are used. Do not use these defaults in production.

Development tips
- If you change server code, `nodemon` restarts the server when running `npm run dev`.
- Use the browser console and network tab to inspect API calls from the client to the server.

Contributing
- Open an issue for bugs or feature requests.
- Make a branch per-change and open a pull request against `main`.

License
- Add a license file if you plan to open-source this repository.

Contact
- For questions about local setup, reply here or open an issue in the repo.
