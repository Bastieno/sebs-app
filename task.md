# Seb's Hub Subscriber Management System

## Project Overview

A comprehensive backend system for managing coworking space subscribers with time-based access control, QR code validation, and admin management features.

## Business Requirements

- **Coworking Space**: Seb's Hub with time-based access plans
- **Payment Method**: Manual receipt upload with admin approval
- **Access Control**: QR code scanning with time validation
- **Admin Roles**: Front desk staff + Super admin
- **Notifications**: Email/SMS for key events
- **Grace Period**: 2 days for monthly plans only

## Technical Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT tokens
- **File Upload**: Multer (receipt images)
- **QR Codes**: qrcode library
- **Email**: Nodemailer
- **SMS**: Twilio/Termii
- **Deployment**: Docker + Railway/Render
- **Frontend**: React.js (admin) + HTML5 (scanner)

## Access Plans Structure

### Daily/Weekly Plans

- **Morning Plan**: ₦2,000 daily (8 AM – 12 PM) / ₦8,000 weekly
- **Afternoon Plan**: ₦3,000 daily (12 PM – 5 PM) / ₦12,000 weekly  
- **Night Plan**: ₦5,000 daily (6 PM – 6 AM) / ₦20,000 weekly
- **Team Night Plan**: Custom pricing (10-14 users)

### Monthly Plans

- **Standard**: ₦30,000/month (ONE time slot access)
- **Premium**: ₦40,000/month (24/7 unlimited access)

---

# IMPLEMENTATION TIMELINE

## Week 1: Core Foundation

### Project Setup

- [x] Initialize Node.js project with Express
- [ ] Set up PostgreSQL database
- [x] Configure Prisma ORM
- [x] Set up project structure and folders
- [x] Configure environment variables
- [x] Set up basic middleware (CORS, body-parser, etc.)
- [x] Create .gitignore file

### Database Schema

- [ ] Create Users table
- [ ] Create Plans table
- [ ] Create Subscriptions table
- [ ] Create Access_Logs table
- [ ] Create Payment_Receipts table
- [ ] Set up database relationships
- [ ] Create database migrations
- [ ] Seed initial plans data

### Authentication System

- [ ] Implement user registration
- [ ] Implement user login
- [ ] Set up JWT token generation
- [ ] Create authentication middleware
- [ ] Implement role-based access control
- [ ] Create password hashing utilities

### File Upload System

- [ ] Configure Multer for receipt uploads
- [ ] Set up file storage (local/cloud)
- [ ] Create file validation middleware
- [ ] Implement receipt upload endpoint

## Week 2: Subscription & Access Control

### Subscription Management

- [ ] Create subscription application endpoint
- [ ] Implement plan selection logic
- [ ] Build admin approval workflow
- [ ] Create subscription status management
- [ ] Implement grace period logic (monthly plans)
- [ ] Add subscription renewal functionality

### QR Code System

- [ ] Implement QR code generation
- [ ] Create unique token system
- [ ] Build QR code validation API
- [ ] Implement time-based access logic
- [ ] Create access logging system
- [ ] Add capacity management

### Web-Based QR Scanner

- [ ] Create HTML5 camera interface
- [ ] Implement QR code scanning (QuaggaJS/ZXing)
- [ ] Build real-time validation display
- [ ] Add entry/exit logging interface
- [ ] Create responsive scanner UI
- [ ] Test scanner on multiple devices

### Notification System

- [ ] Set up email service (Nodemailer)
- [ ] Configure SMS service (Twilio/Termii)
- [ ] Create notification templates
- [ ] Implement subscription approval notifications
- [ ] Add expiration warning notifications
- [ ] Create grace period alerts

## Week 3: Admin Features & Deployment

### Admin Dashboard

- [ ] Create admin authentication
- [ ] Build user management interface
- [ ] Implement payment approval system
- [ ] Create subscription management panel
- [ ] Add access logs viewing
- [ ] Build analytics and reporting
- [ ] Implement role-based admin features

### Super Admin Features

- [ ] User CRUD operations
- [ ] Plan management system
- [ ] System settings configuration
- [ ] Staff management interface
- [ ] Advanced analytics dashboard
- [ ] System backup/restore features

### API Documentation

- [ ] Document all API endpoints
- [ ] Create Postman collection
- [ ] Write API usage examples
- [ ] Create admin user guide
- [ ] Document deployment process

### Testing & Quality Assurance

- [ ] Unit tests for core functions
- [ ] Integration tests for API endpoints
- [ ] Test QR code generation/validation
- [ ] Test notification system
- [ ] Test admin workflows
- [ ] Performance testing
- [ ] Security testing

### Deployment

- [ ] Create Dockerfile
- [ ] Set up Docker Compose
- [ ] Configure production environment
- [ ] Deploy to Railway/Render
- [ ] Set up production database
- [ ] Configure domain and SSL
- [ ] Test production deployment
- [ ] Create deployment documentation

---

# DATABASE SCHEMA

## Users Table

```sql
id (UUID, Primary Key)
email (String, Unique)
name (String)
phone (String)
role (Enum: user, admin, super_admin)
password_hash (String)
is_active (Boolean, Default: true)
created_at (DateTime)
updated_at (DateTime)
```

## Plans Table

```sql
id (UUID, Primary Key)
name (String)
price (Decimal)
duration_type (Enum: daily, weekly, monthly)
time_start (Time, Nullable)
time_end (Time, Nullable)
max_capacity (Integer, Nullable)
is_active (Boolean, Default: true)
created_at (DateTime)
```

## Subscriptions Table

```sql
id (UUID, Primary Key)
user_id (UUID, Foreign Key)
plan_id (UUID, Foreign Key)
time_slot (Enum: morning, afternoon, night, all)
status (Enum: pending, active, expired, suspended)
start_date (Date)
end_date (Date)
grace_end_date (Date, Nullable)
qr_token (String, Unique)
admin_notes (Text, Nullable)
approved_by (UUID, Foreign Key, Nullable)
approved_at (DateTime, Nullable)
created_at (DateTime)
updated_at (DateTime)
```

## Access_Logs Table

```sql
id (UUID, Primary Key)
user_id (UUID, Foreign Key)
subscription_id (UUID, Foreign Key)
action (Enum: entry, exit)
timestamp (DateTime)
scanner_location (String, Default: 'main_entrance')
validation_result (Enum: success, denied, expired, invalid_time)
created_at (DateTime)
```

## Payment_Receipts Table

```sql
id (UUID, Primary Key)
subscription_id (UUID, Foreign Key)
receipt_url (String)
amount (Decimal)
status (Enum: pending, approved, rejected)
uploaded_at (DateTime)
processed_at (DateTime, Nullable)
processed_by (UUID, Foreign Key, Nullable)
admin_notes (Text, Nullable)
```

---

# API ENDPOINTS CHECKLIST

## Authentication Endpoints

- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] GET /api/auth/me
- [ ] PUT /api/auth/change-password

## User Endpoints

- [ ] GET /api/user/profile
- [ ] PUT /api/user/profile
- [ ] GET /api/user/subscriptions
- [ ] GET /api/user/qr-code
- [ ] GET /api/user/access-logs

## Subscription Endpoints

- [ ] GET /api/plans
- [ ] POST /api/subscriptions/apply
- [ ] POST /api/subscriptions/upload-receipt
- [ ] GET /api/subscriptions/:id/status
- [ ] PUT /api/subscriptions/:id/renew

## Access Control Endpoints

- [ ] POST /api/access/validate-qr
- [ ] GET /api/access/current-capacity
- [ ] POST /api/access/manual-entry
- [ ] GET /api/access/logs

## Admin Endpoints

- [ ] GET /api/admin/pending-payments
- [ ] PUT /api/admin/approve-payment/:id
- [ ] PUT /api/admin/reject-payment/:id
- [ ] GET /api/admin/users
- [ ] PUT /api/admin/user-status/:id
- [ ] GET /api/admin/subscriptions
- [ ] GET /api/admin/access-logs
- [ ] GET /api/admin/analytics

## Super Admin Endpoints

- [ ] POST /api/super-admin/users
- [ ] PUT /api/super-admin/users/:id
- [ ] DELETE /api/super-admin/users/:id
- [ ] POST /api/super-admin/plans
- [ ] PUT /api/super-admin/plans/:id
- [ ] GET /api/super-admin/system-stats
- [ ] POST /api/super-admin/staff

---

# DEPLOYMENT CHECKLIST

## Pre-deployment

- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Production build tested
- [ ] Security configurations verified
- [ ] SSL certificates prepared

## Deployment Steps

- [ ] Create production database
- [ ] Deploy application to cloud platform
- [ ] Run database migrations
- [ ] Seed initial data (plans, super admin)
- [ ] Configure domain and SSL
- [ ] Test all endpoints in production
- [ ] Set up monitoring and logging

## Post-deployment

- [ ] Create super admin account
- [ ] Test complete user workflow
- [ ] Test admin workflows
- [ ] Verify notification system
- [ ] Test QR scanner functionality
- [ ] Create user documentation
- [ ] Train staff on system usage

---

# PROGRESS TRACKING

**Current Status**: ✅ Project Setup Complete - Server Running
**Next Milestone**: Database Schema & Authentication System
**Overall Progress**: 15% Complete

**Last Updated**: August 2, 2025
**Estimated Completion**: August 22, 2025
