# SmartSeason Field Monitoring System

A full-stack web application for tracking crop progress across multiple fields during a growing season. Built with Node.js, Express, PostgreSQL, and React.

## Overview

SmartSeason helps agricultural coordinators and field agents monitor crop development through a simple, intuitive interface. The system supports role-based access control, real-time field status tracking, and comprehensive update management.

## Features

### User Management
- **Role-based Authentication**: Admin (Coordinator) and Field Agent roles
- **Secure Login/Registration**: JWT-based authentication with bcrypt password hashing
- **Access Control**: Role-specific permissions for different features

### Field Management
- **CRUD Operations**: Create, read, update, and delete fields (Admin only)
- **Field Assignment**: Assign fields to specific field agents
- **Field Information**: Track name, crop type, planting date, and current stage

### Field Stages
- **Growth Lifecycle**: Planted -> Growing -> Ready -> Harvested
- **Stage Updates**: Field agents can update field stages with observations
- **Update History**: Complete audit trail of all field changes

### Status Logic
The system automatically calculates field status based on:

- **Active**: Fields progressing normally through growth stages
- **At Risk**: Fields stuck in a stage too long (e.g., planted >30 days, growing >120 days)
- **Completed**: Fields that have been harvested

### Dashboard Analytics
- **Admin View**: Overview of all fields, agent assignments, and system statistics
- **Agent View**: Personal dashboard showing assigned fields and update history
- **Real-time Stats**: Field counts by stage and status

## Technical Architecture

### Backend (Node.js + Express)
- **Framework**: Express.js with middleware for CORS and JSON parsing
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Design**: RESTful endpoints with proper error handling

### Frontend (React + TypeScript)
- **Framework**: React 19 with hooks for state management
- **Routing**: React Router for navigation
- **Styling**: Tailwind CSS with custom Shamba Records theme colors
- **HTTP Client**: Axios with request/response interceptors
- **Icons**: Heroicons for consistent iconography

## Database Schema

### Users Table
- `id` (Primary Key)
- `username` (Unique)
- `email` (Unique)
- `password_hash` (bcrypt)
- `role` (admin/agent)
- `created_at`, `updated_at`

### Fields Table
- `id` (Primary Key)
- `name`, `crop_type`, `planting_date`
- `current_stage` (planted/growing/ready/harvested)
- `status` (active/at_risk/completed)
- `assigned_agent_id` (Foreign Key to users)
- `created_at`, `updated_at`

### Field_Updates Table
- `id` (Primary Key)
- `field_id` (Foreign Key)
- `agent_id` (Foreign Key)
- `stage`, `notes`
- `update_date`, `created_at`

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd Field-Monitoring-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb smartseason

# Run schema and seed data
psql -d smartseason -f backend/database/init.sql
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartseason
DB_USER=postgres
DB_PASSWORD=your_password
```

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start the Application

```bash
# Start the backend (from backend directory)
cd backend
npm run dev

# Start the frontend (from frontend directory)
cd ../frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Demo Credentials

### Admin Account
- **Email**: admin@smartseason.com
- **Password**: password

### Field Agent Accounts
- **Email**: agent1@smartseason.com / agent2@smartseason.com
- **Password**: password

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Fields
- `GET /api/fields` - Get all fields (admin) or assigned fields (agent)
- `GET /api/fields/:id` - Get specific field
- `POST /api/fields` - Create new field (admin only)
- `PUT /api/fields/:id` - Update field (admin only)
- `DELETE /api/fields/:id` - Delete field (admin only)
- `PUT /api/fields/:id/stage` - Update field stage
- `GET /api/fields/:id/updates` - Get field updates
- `GET /api/fields/stats/dashboard` - Get dashboard statistics

### Users
- `GET /api/users/agents` - Get all field agents (admin only)

## Deployment

### Frontend → Vercel, Backend → Render

#### 1. Deploy Backend on Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and create a new **Web Service**
3. Connect your GitHub repository and set the **Root Directory** to `backend`
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Create a **PostgreSQL** instance on Render and note the connection details
6. Add the following **Environment Variables** in Render's dashboard:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your_secure_secret_key
   FRONTEND_URL=https://your-app.vercel.app
   DB_HOST=your-render-postgres-host
   DB_PORT=5432
   DB_NAME=smartseason
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   ```
7. Run the schema on your Render PostgreSQL instance:
   ```bash
   psql -h your-render-postgres-host -U your-db-user -d smartseason -f backend/database/init.sql
   ```
8. Note your Render backend URL (e.g. `https://smartseason-api.onrender.com`)

#### 2. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and create a new project
2. Import your GitHub repository and set the **Root Directory** to `frontend`
3. Configure:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Add the following **Environment Variable**:
   ```
   REACT_APP_API_URL=https://your-smartseason-api.onrender.com/api
   ```
5. Deploy — Vercel handles SPA routing automatically via `vercel.json`

#### 3. Update Backend CORS

Once you have your Vercel URL, ensure the `FRONTEND_URL` on Render matches it exactly:
```
FRONTEND_URL=https://your-app.vercel.app
```

## Design Decisions

### 1. Status Logic Implementation
The field status is calculated dynamically based on the current stage and time elapsed since planting:

- **Planted > 30 days**: At Risk
- **Growing > 120 days**: At Risk
- **Ready > 150 days**: At Risk
- **Harvested**: Completed

### 2. Role-Based Access Control
- **Admin**: Full access to all fields, can create/assign fields, view all updates
- **Field Agent**: Can only view assigned fields, update stages, and add observations

### 3. Database Design
- **Normalized Schema**: Separate tables for users, fields, and updates
- **Foreign Key Constraints**: Ensure data integrity between related entities
- **Indexes**: Optimized for common query patterns (agent assignments, field lookups)

### 4. Frontend Architecture
- **Component-Based**: Modular React components for reusability
- **Context API**: Centralized authentication state management
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Error Handling**: User-friendly error messages and loading states

### 5. Security Considerations
- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Stateless authentication with expiration
- **Input Validation**: Server-side validation for all user inputs
- **CORS Configuration**: Restricted to the configured `FRONTEND_URL`

## Theme and Styling

Custom theme inspired by Shamba Records with agricultural-focused colors:

- **Primary Green**: `#22c55e` (shamba-green)
- **Dark Green**: `#16a34a` (shamba-dark-green)
- **Light Green**: `#86efac` (shamba-light-green)
- **Earth Brown**: `#92400e` (shamba-earth)
- **Sky Blue**: `#0ea5e9` (shamba-sky)
- **Yellow**: `#eab308` (shamba-yellow)

## Future Enhancements

- Email notifications for at-risk fields
- Native mobile application for field agents
- Historical data analysis and trend reporting
- Image upload for visual field documentation
- Weather data integration for better risk assessment
- Multi-tenant support for multiple farms/organizations

## License

This project is licensed under the MIT License.
