# CPF - Competitive Programming Fusion Platform

CPF is a full-stack web app that helps you track upcoming competitive programming contests and monitor your profile stats across multiple platforms.

## Resume Summary

`CPF - Competitive Programming Fusion Platform` - Link  
`11/2025 - 12/2025 | Pune`

- Developed a centralized CP contest aggregator using React, Node.js, and Express.js, exposing REST APIs with CORS support and managing data on MongoDB Atlas.
- Implemented authentication using JWT, handled sessions with `cookie-parser`, and integrated automated email reminders via Nodemailer based on user notification preferences.

It combines:
- a React frontend for dashboard, calendar, and profile management
- a Node.js/Express backend for auth, contest aggregation, notifications, and platform stats
- MongoDB for user accounts, preferences, and notification history

## What This Project Does

- Aggregates upcoming contests from multiple platforms in one place.
- Shows cross-platform profile stats for:
	- LeetCode
	- Codeforces
	- CodeChef
	- AtCoder
- Supports user auth (signup/login/logout) with JWT + cookie session handling.
- Lets users configure reminder preferences.
- Sends scheduled email reminders before contests.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Framer Motion, FullCalendar, Recharts
- Backend: Node.js, Express, Mongoose, JWT, Node-Cron, Nodemailer
- Database: MongoDB

## Project Structure

```text
cpf/
	backend/
		server.js
		models/
		services/
	frontend/
		src/
			Components/
			Pages/
```

## Prerequisites

- Node.js 18+ (recommended)
- npm
- MongoDB running locally or a MongoDB Atlas URI

## Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` and set values like these:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cpf
JWT_SECRET=replace_with_a_strong_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

CODEFORCES_API_URL=https://codeforces.com/api/contest.list?gym=false
ATCODER_API_URL=https://kenkoooo.com/atcoder/resources/contests.json
LEETCODE_API_URL=your_leetcode_contest_endpoint
CODECHEF_API_URL=your_codechef_contest_endpoint
```

Notes:
- `EMAIL_USER` and `EMAIL_PASS` are optional. If missing, email reminders are skipped.
- `LEETCODE_API_URL` and `CODECHEF_API_URL` should return data in a shape the backend expects.

### Frontend (`frontend/.env`)

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## Local Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

3. Start backend (from `backend/`):

```bash
npm run dev
```

4. Start frontend (from `frontend/`):

```bash
npm run dev
```

5. Open the frontend URL shown by Vite (usually `http://localhost:5173`).

## Backend API (Main Endpoints)

- `POST /api/users/register`
- `POST /api/users/login`
- `POST /api/users/logout`
- `GET /api/users/me`
- `PUT /api/users/preferences`
- `GET /api/contests`
- `GET /api/users/stats`

## Scheduler and Notifications

- A cron scheduler runs every hour.
- For users with email reminders enabled, it checks contests starting in:
	- ~24 hours (one-day reminder)
	- ~48 hours (two-day reminder)
- Notification history is stored to avoid duplicate sends.

## Scripts

### Backend
- `npm run dev` - run backend with nodemon
- `npm start` - run backend with node

### Frontend
- `npm run dev` - start Vite dev server
- `npm run build` - build production bundle
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## Current Scope

This project is currently focused on core user flow and contest tracking. It is suitable as a strong base for adding:
- push notifications
- Discord/Telegram channels
- richer analytics and charts
- deployment-ready auth/security hardening
