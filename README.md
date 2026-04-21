# SmartSeason Field Monitoring System

A full-stack web application for tracking crop progress across multiple fields during a growing season. Built with Node.js, Express, PostgreSQL, and React + TypeScript.

---

## Overview

SmartSeason helps agricultural coordinators and field agents monitor crop development through a clean, intuitive interface. The system supports role-based access control, real-time field status tracking, and comprehensive update management.

---

## Features

### 1. Users & Access (Role-Based Authentication)
- **Admin (Coordinator)**: Full access — create/edit/delete fields, assign agents, view all updates and dashboard stats
- **Field Agent**: Restricted access — view only assigned fields, update stages, add observations
- JWT-based authentication with bcrypt password hashing
- Protected routes on both frontend and backend — unauthenticated users are redirected to login

### 2. Field Management
- Admins can create, edit, and delete fields
- Each field tracks: name, crop type, planting date, current stage, status, assigned agent
- Fields can be assigned to specific field agents
- Agents only see fields assigned to them

### 3. Field Updates
- Field agents can update the stage of their assigned fields
- Agents can add notes/observations with each stage update
- Full update history is maintained per field (audit trail)
- Admins can view all updates across all agents

### 4. Field Stages
Sequential lifecycle:
```
Planted → Growing → Ready → Harvested
```

### 5. Field Status Logic
Status is computed dynamically based on current stage and days since planting:

| Stage    | Condition              | Status    |
|----------|------------------------|-----------|
| Any      | Stage = harvested      | Completed |
| Planted  | > 30 days since plant  | At Risk   |
| Growing  | > 120 days since plant | At Risk   |
| Ready    | > 150 days since plant | At Risk   |
| Any      | Within thresholds      | Active    |

**Rationale**: These thresholds reflect typical crop growth timelines. A field stuck in "planted" for over a month likely has germination issues. A field in "growing" for over 4 months is overdue for maturity. These can be adjusted per crop type in future iterations.

### 6. Dashboard
- **Admin**: Total fields, status breakdown, stage distribution, at-risk field alerts with agent info, agent workload overview
- **Agent**: Personal field counts, status and stage breakdown for assigned fields

---

## Technical Architecture

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Database**: PostgreSQL with `pg` connection pooling
- **Authentication**: JWT tokens (24h expiry) + bcrypt password hashing
- **Validation**: express-validator on all input endpoints
- **Security**: helmet, CORS restricted to frontend URL

### Frontend (React + TypeScript)
- **Framework**: React 19 with hooks
- **Routing**: React Router v7 with protected routes
- **Styling**: Tailwind CSS v3 with custom Shamba Records theme
- **HTTP Client**: Axios with JWT interceptors and 401 auto-redirect
- **State**: Context API for auth state

---

## Database Schema

### users
| Column        | Type      | Notes              |
|---------------|-----------|--------------------|
| id            | SERIAL PK |                    |
| username      | VARCHAR   | unique             |
| email         | VARCHAR   | unique             |
| password_hash | VARCHAR   | bcrypt             |
| role          | VARCHAR   | admin / agent      |
| created_at    | TIMESTAMP |                    |
| updated_at    | TIMESTAMP | auto-updated       |

### fields
| Column            | Type      | Notes                        |
|-------------------|-----------|------------------------------|
| id                | SERIAL PK |                              |
| name              | VARCHAR   |                              |
| crop_type         | VARCHAR   |                              |
| planting_date     | DATE      |                              |
| current_stage     | VARCHAR   | planted/growing/ready/harvested |
| status            | VARCHAR   | active/at_risk/completed     |
| assigned_agent_id | INTEGER   | FK → users(id)               |
| created_at        | TIMESTAMP |                              |
| updated_at        | TIMESTAMP | auto-updated via trigger     |

### field_updates
| Column      | Type      | Notes              |
|-------------|-----------|--------------------|
| id          | SERIAL PK |                    |
| field_id    | INTEGER   | FK → fields(id)    |
| agent_id    | INTEGER   | FK → users(id)     |
| stage       | VARCHAR   |                    |
| notes       | TEXT      | optional           |
| update_date | TIMESTAMP |                    |
| created_at  | TIMESTAMP |                    |

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL v12+
- npm

### 1. Clone and Install

```bash
git clone <repository-url>
cd Field-Monitoring-system

cd backend && npm install
cd ../frontend && npm install
```

### 2. Database Setup

```bash
createdb smartseason
psql -d smartseason -f backend/database/init.sql
```

### 3. Environment Configuration

`backend/.env`:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartseason
DB_USER=postgres
DB_PASSWORD=your_password
```

`frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run the Application

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Demo Credentials

| Role        | Email                      | Password |
|-------------|----------------------------|----------|
| Admin       | admin@smartseason.com      | password |
| Field Agent | agent1@smartseason.com     | password |
| Field Agent | agent2@smartseason.com     | password |

---

## API Endpoints

### Authentication
| Method | Endpoint             | Description         | Auth |
|--------|----------------------|---------------------|------|
| POST   | /api/auth/register   | Register new user   | No   |
| POST   | /api/auth/login      | Login               | No   |
| GET    | /api/auth/me         | Get current user    | Yes  |

### Fields
| Method | Endpoint                    | Description                        | Role       |
|--------|-----------------------------|------------------------------------|------------|
| GET    | /api/fields                 | All fields (admin) / assigned (agent) | Both    |
| GET    | /api/fields/:id             | Get specific field                 | Both       |
| POST   | /api/fields                 | Create field                       | Admin only |
| PUT    | /api/fields/:id             | Update field                       | Admin only |
| DELETE | /api/fields/:id             | Delete field                       | Admin only |
| PUT    | /api/fields/:id/stage       | Update field stage                 | Both       |
| GET    | /api/fields/:id/updates     | Get field update history           | Both       |
| GET    | /api/fields/stats/dashboard | Dashboard statistics               | Both       |

### Users
| Method | Endpoint          | Description          | Role       |
|--------|-------------------|----------------------|------------|
| GET    | /api/users/agents | Get all field agents | Admin only |

---

## Deployment

### Frontend → Vercel, Backend → Render

#### Backend (Render)
1. Create a **Web Service** on Render, root directory: `backend`
2. Build command: `npm install` | Start command: `npm start`
3. Create a **PostgreSQL** instance on Render
4. Set environment variables:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your_secure_secret
   FRONTEND_URL=https://your-app.vercel.app
   DB_HOST=your-render-postgres-host
   DB_PORT=5432
   DB_NAME=smartseason
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   ```
5. Run schema: `psql -h <host> -U <user> -d smartseason -f backend/database/init.sql`

#### Frontend (Vercel)
1. Create a new project on Vercel, root directory: `frontend`
2. Framework: Create React App | Build: `npm run build` | Output: `build`
3. Set environment variable:
   ```
   REACT_APP_API_URL=https://your-smartseason-api.onrender.com/api
   ```
4. `vercel.json` is already configured for SPA routing

---

## Design Decisions

### 1. Status Logic
Computed dynamically on every field fetch rather than stored statically. This ensures status always reflects the current date without needing scheduled jobs. The thresholds (30/120/150 days) are based on general crop growth timelines and can be made configurable per crop type in a future iteration.

### 2. Role-Based Access Control
Two-tier RBAC enforced at both the API level (middleware) and frontend (route guards + conditional UI). Agents cannot see or interact with fields not assigned to them — enforced via SQL `WHERE assigned_agent_id = ?` clauses, not just UI hiding.

### 3. Database Design
Normalized schema with three tables. Foreign key constraints ensure referential integrity. `ON DELETE CASCADE` on field_updates means deleting a field cleans up its history automatically. Indexes on common query patterns (agent_id, status, stage) keep queries fast.

### 4. Frontend Architecture
Context API for auth state (simple, no Redux overhead needed). Axios interceptors handle token injection and 401 auto-logout globally. Protected routes redirect unauthenticated users to login with a loading state to prevent flash of content.

### 5. SQLite vs PostgreSQL
SQLite is used for local development convenience (`index-sqlite.js`). PostgreSQL (`index.js`) is used for production. The `npm start` script points to the PostgreSQL entry point.

---

## Assumptions Made

1. **Sequential stages**: Fields progress through stages in order. The system doesn't enforce this — agents can set any stage — but the UI and status logic assume forward progression.
2. **Single agent per field**: Each field is assigned to exactly one agent for clear accountability.
3. **Time-based risk thresholds**: The 30/120/150-day thresholds are general estimates. Real deployments would tune these per crop type.
4. **No email notifications**: At-risk alerts are visible on the dashboard but not sent via email (noted as a future enhancement).
5. **Admin self-registration**: The registration form allows selecting the admin role. In production this would be restricted to invite-only or a separate admin creation flow.

---

## Future Enhancements

- Email/SMS notifications for at-risk fields
- Per-crop-type configurable risk thresholds
- Image upload for field documentation
- Weather data integration
- Mobile-native app for field agents
- Multi-tenant support for multiple farms

---

## License

This project is licensed under the [MIT License](./LICENSE) © 2026 SmartSeason · Powered by Shamba Records
