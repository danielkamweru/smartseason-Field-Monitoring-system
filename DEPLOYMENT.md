# SmartSeason Field Monitoring System - Deployment Guide

## Overview
This guide explains how to deploy the SmartSeason Field Monitoring System to production using Render for the backend and Vercel for the frontend.

## Architecture
- **Frontend**: React app deployed on Vercel
- **Backend**: Node.js/Express API deployed on Render
- **Database**: PostgreSQL hosted on Render

## Backend Deployment (Render)

### Prerequisites
- Render account
- GitHub repository with backend code

### Steps

1. **Create PostgreSQL Database**
   - Go to Render Dashboard
   - Click "New" -> "PostgreSQL"
   - Name: `smartseason-db`
   - Database Name: `smartseason_db`
   - User: `smartseason_user`
   - Plan: Free
   - Click "Create Database"

2. **Create Backend Service**
   - Go to Render Dashboard
   - Click "New" -> "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=10000
     FRONTEND_URL=https://smartseason-field-monitoring-system.vercel.app
     JWT_SECRET=your-secret-key-here
     DATABASE_URL=postgresql://user:password@host:port/database
     ```
   - Click "Create Web Service"

3. **Configure Database Connection**
   - Once the database is created, copy the connection string
   - Add it to your backend service environment variables as `DATABASE_URL`

### Backend Environment Variables
```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://smartseason-field-monitoring-system.vercel.app
JWT_SECRET=your-secure-jwt-secret-key
DATABASE_URL=postgresql://username:password@host:port/database
```

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- GitHub repository with frontend code

### Steps

1. **Create Vercel Project**
   - Go to Vercel Dashboard
   - Click "New Project"
   - Import your GitHub repository
   - Select the `client` folder
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com/api
     ```
   - Click "Deploy"

2. **Frontend Environment Variables**
   ```env
   VITE_API_URL=https://smartseason-field-monitoring-system-48jg.onrender.com/api
   ```

## Post-Deployment Setup

### 1. Database Initialization
The backend will automatically initialize the database with:
- Demo users (admin and agent)
- Sample fields
- Required tables

### 2. Test the Application
1. **Backend Health Check**:
   ```bash
   curl https://your-backend-url.onrender.com/api/health
   ```

2. **Test Registration**:
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@example.com","password":"password123","role":"admin"}'
   ```

3. **Test Login**:
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@smartseason.com","password":"password"}'
   ```

### 3. Access the Application
- **Frontend URL**: https://smartseason-field-monitoring-system.vercel.app
- **Backend URL**: https://smartseason-field-monitoring-system-48jg.onrender.com

## Demo Credentials
- **Admin**: admin@smartseason.com / password
- **Agent**: agent1@smartseason.com / password

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL environment variable
   - Ensure PostgreSQL database is running
   - Verify SSL settings

2. **CORS Errors**
   - Check FRONTEND_URL environment variable
   - Ensure frontend URL is whitelisted

3. **Registration/Login Fails**
   - Check database initialization
   - Verify JWT_SECRET is set
   - Check backend logs for errors

4. **Frontend Not Connecting**
   - Verify VITE_API_URL is correct
   - Check backend is running
   - Test API endpoints directly

### Monitoring
- **Backend Logs**: Available in Render dashboard
- **Frontend Logs**: Available in Vercel dashboard
- **Database**: Monitor via Render PostgreSQL dashboard

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to Git
   - Use strong JWT secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use SSL connections
   - Limit database user permissions
   - Regular backups

3. **API Security**
   - Enable CORS properly
   - Use helmet.js for security headers
   - Validate all inputs

## Scaling

### Backend Scaling
- Upgrade Render plan as needed
- Add load balancers
- Consider Redis for caching

### Database Scaling
- Upgrade PostgreSQL plan
- Implement connection pooling
- Consider read replicas

### Frontend Scaling
- Vercel automatically scales
- Consider CDN for static assets
- Optimize bundle size

## Support

For issues:
1. Check application logs
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity
