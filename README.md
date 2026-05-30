# CPF - Contest Pulse Feed

CPF is a competitive programming contest tracker. This repository contains two versions of the same idea:

- **Full JavaScript version:** React frontend with a Node.js/Express backend.
- **Python Flask version:** Flask app with server-rendered templates.

Both versions help track contests from platforms like LeetCode, Codeforces, CodeChef, and AtCoder, and include user/profile features for managing coding platform handles.

## Projects In This Repository

### 1. JavaScript Full-Stack App

This is the newer full-stack version.

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, FullCalendar, Recharts
- **Backend:** Node.js, Express, Mongoose, JWT, Node-Cron, Nodemailer
- **Database:** MongoDB
- **Folders:** `frontend/`, `backend/`

Main features:

- Contest calendar and dashboard
- User authentication
- Profile and platform handle management
- Cross-platform stats
- Email reminder scheduler

### 2. Python Flask App

This is the Flask-based version.

- **Backend:** Flask, Python
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript, Chart.js
- **Folder:** `flask_based_app/`

Main features:

- Contest aggregator
- Login and registration
- Personalized contest dashboard
- Profile page with platform handles
- Platform statistics and chart visualization

## Project Structure

```text
cpf/
├── backend/                 # Node.js / Express backend
│   ├── server.js
│   ├── models/
│   └── services/
├── frontend/                # React / Vite frontend
│   └── src/
│       ├── Components/
│       └── Pages/
└── flask_based_app/         # Python Flask implementation
    ├── app.py
    ├── requirements.txt
    ├── run.sh
    ├── services/
    ├── static/
    └── templates/
```

## Running The JavaScript Version

### Backend

Create `backend/.env`:

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

Install and run:

```bash
cd backend
npm install
npm run dev
```

### Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Install and run:

```bash
cd frontend
npm install
npm run dev
```

The React app usually runs at:

```text
http://localhost:5173
```

## Running The Flask Version

Go to the Flask app:

```bash
cd flask_based_app
```

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `flask_based_app/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name
JWT_SECRET=a_super_secret_key
```

Run the Flask app:

```bash
chmod +x run.sh
./run.sh
```

The Flask app starts at:

```text
http://127.0.0.1:5000
```

## Notes

- Use `backend/` and `frontend/` for the JavaScript full-stack app.
- Use `flask_based_app/` for the Python Flask app.
- Both apps use port `5000` for the backend/server, so run only one backend at a time unless you change the port.
