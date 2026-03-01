# PrimeTrade Task Manager

A full-stack task management app built with Node.js, MongoDB, and React. Has JWT auth, role-based access, and a clean dashboard UI.

---

## Stack

- **Backend** — Node.js + Express
- **Database** — MongoDB (Mongoose)
- **Auth** — JWT + bcrypt
- **Validation** — express-validator
- **API Docs** — Swagger UI
- **Frontend** — React 18 + Vite


---

## Project Structure

```
primetrade-assignment/
├── backend/
│   ├── config/db.js
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   └── admin.js
│   ├── validators/index.js
│   ├── swagger.js
│   ├── server.js
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   └── AdminPage.jsx
│   │   ├── utils/api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── PrimeTrade-API.postman_collection.json
├── SCALABILITY.md
└── README.md
```

---

## Getting Started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set your `JWT_SECRET` to something strong. Then:

```bash
npm run dev       # dev mode with nodemon
npm start         # production
```

Runs on `http://localhost:5000`  
Swagger docs at `http://localhost:5000/api-docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

> Make sure the backend is running first — the frontend proxies API calls to port 5000.

---

## API Overview

### Auth — `/api/v1/auth`

| Method | Route | Auth | What it does |
|--------|-------|------|--------------|
| POST | /register | No | Create account |
| POST | /login | No | Login, get JWT token |
| GET | /me | Yes | Get your profile |

### Tasks — `/api/v1/tasks`

| Method | Route | Auth | What it does |
|--------|-------|------|--------------|
| GET | / | Yes | List tasks (paginated, filterable) |
| GET | /:id | Yes | Get one task |
| POST | / | Yes | Create task |
| PUT | /:id | Yes | Update task |
| DELETE | /:id | Yes | Delete task |

Regular users only see their own tasks. Admins see everything.

### Admin — `/api/v1/admin`

| Method | Route | Auth | What it does |
|--------|-------|------|--------------|
| GET | /users | Admin | List all users |
| DELETE | /users/:id | Admin | Remove a user |
| GET | /stats | Admin | System stats |

---

## Auth

Every protected route needs a Bearer token in the header:

```
Authorization: Bearer <token>
```

Get your token from `/api/v1/auth/login` or `/api/v1/auth/register`.

---

## Database

Two collections — users and tasks.

```js
// User
{
  name, email, password,   // password is bcrypt hashed, never returned
  role,                    // 'user' or 'admin'
  createdAt, updatedAt
}

// Task
{
  title, description,
  status,    // pending | in_progress | completed
  priority,  // low | medium | high
  user,      // ref to User
  createdAt, updatedAt
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill these in:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/primetrade
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Docker (optional)

To spin up the full stack (Mongo + backend + frontend) in one go:

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend | http://localhost:5000 |
| API Docs | http://localhost:5000/api-docs |

To stop: `docker-compose down`  
To wipe data too: `docker-compose down -v`

---

## Security notes

- Passwords hashed with bcrypt (12 rounds)
- JWT signed with HS256, expires in 7 days by default
- Rate limiting on all routes (100/15min), stricter on auth (10/15min)
- Helmet for secure headers
- Input validation on every POST/PUT
- CORS locked to frontend origin only
- Request body capped at 10kb