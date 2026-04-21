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
# Clone the repository
git clone <repository-url>
cd Field-Monitoring-system

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb smartseason

# Import the database schema
psql -d smartseason -f server/database/init.sql
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartseason
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start the Application

```bash
# Start the backend server (from server directory)
cd server
npm run dev

# Start the frontend development server (from client directory)
cd ../client
npm start
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Demo Credentials

### Admin Account
- **Email**: admin@smartseason.com
- **Password**: password

### Field Agent Account
- **Email**: agent1@smartseason.com
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

## Design Decisions

### 1. Status Logic Implementation
The field status is calculated dynamically based on the current stage and time elapsed since planting:

- **Planted > 30 days**: At Risk (should be growing by now)
- **Growing > 120 days**: At Risk (taking too long to mature)
- **Ready > 150 days**: At Risk (should be harvested)
- **Harvested**: Completed (final state)

This approach provides automated risk detection while allowing manual intervention through stage updates.

### 2. Role-Based Access Control
- **Admin**: Full access to all fields, can create/assign fields, view all updates
- **Field Agent**: Can only view assigned fields, update stages, and add observations

### 3. Database Design
- **Normalized Schema**: Separate tables for users, fields, and updates to avoid data duplication
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
- **CORS Configuration**: Proper cross-origin resource sharing setup

## Assumptions Made

1. **Time-Based Status**: The risk assessment logic assumes typical crop growth timelines. These thresholds can be adjusted based on specific crop requirements.

2. **Single Agent Assignment**: Each field is assigned to exactly one field agent for clear responsibility.

3. **Sequential Stage Progression**: Fields progress through stages in order (Planted -> Growing -> Ready -> Harvested).

4. **Local Development**: The setup assumes local PostgreSQL installation. For production, consider cloud database solutions.

5. **Basic Notifications**: The system doesn't include email notifications but can be extended to add alerts for at-risk fields.

## Future Enhancements

- **Email Notifications**: Automated alerts for at-risk fields
- **Mobile App**: Native mobile application for field agents
- **Advanced Analytics**: Historical data analysis and trend reporting
- **Image Upload**: Visual field documentation with photos
- **Weather Integration**: Weather data integration for better risk assessment
- **Multi-Tenant Support**: Support for multiple farms/organizations

## Testing

The application includes:
- **API Testing**: Manual testing through Postman or similar tools
- **Frontend Testing**: User interface testing through browser
- **Integration Testing**: End-to-end workflow verification

## Deployment

### Option 1: Deploy to Vercel (Frontend) + Render (Backend)

#### Backend Deployment (Render/Railway)
1. Push your code to GitHub
2. Create a new Web Service on Render or Railway
3. Connect your GitHub repository
4. Configure the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     PORT=5000
     DB_HOST=your-postgres-host
     DB_PORT=5432
     DB_NAME=smartseason
     DB_USER=your-db-user
     DB_PASSWORD=your-db-password
     JWT_SECRET=your-secure-secret-key
     ```
5. Create a PostgreSQL database on the same platform
6. Run the database schema (see `server/database/init.sql`)

#### Frontend Deployment (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Or deploy directly from Vercel
3. Configure environment variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
4. For production, update `src/services/api.ts` to use the production API URL

### Option 2: Deploy Both on Render
1. Create a Render account
2. Deploy backend as a Web Service
3. Deploy frontend as a Static Site with publish directory as `dist`
4. Add redirect rule for SPA: `/` -> `/index.html`

### Option 3: Docker Deployment
Create a `Dockerfile` in the root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd client && npm run build

# Expose ports
EXPOSE 5000

# Start backend
CMD ["cd", "server", "npm", "start"]
```

## Theme and Styling

The application uses a custom theme inspired by Shamba Records, with agricultural-focused colors:

- **Primary Green**: `#22c55e` (shamba-green)
- **Dark Green**: `#16a34a` (shamba-dark-green)
- **Light Green**: `#86efac` (shamba-light-green)
- **Earth Brown**: `#92400e` (shamba-earth)
- **Sky Blue**: `#0ea5e9` (shamba-sky)
- **Yellow**: `#eab308` (shamba-yellow)

The design emphasizes clean, modern interfaces with agricultural context, using the Inter and Poppins font families for professional readability.

## Support

For issues or questions, please refer to the code documentation or contact the development team.

## License

This project is licensed under the MIT License.
