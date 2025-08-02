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
- [x] Set up PostgreSQL database
- [x] Configure Prisma ORM
- [x] Set up project structure and folders
- [x] Configure environment variables
- [x] Set up basic middleware (CORS, body-parser, etc.)
- [x] Create .gitignore file

### Database Schema

- [x] Create Users table
- [x] Create Plans table
- [x] Create Subscriptions table
- [x] Create Access_Logs table
- [x] Create Payment_Receipts table
- [x] Set up database relationships
- [x] Create database migrations
- [x] Seed initial plans data

### Authentication System

- [x] Implement user registration
- [x] Implement user login
- [x] Set up JWT token generation
- [x] Create authentication middleware
- [x] Implement role-based access control
- [x] Create password hashing utilities

### File Upload System

- [x] Configure Multer for receipt uploads
- [x] Set up file storage (local/cloud)
- [x] Create file validation middleware
- [x] Implement receipt upload endpoint

## Week 2: Subscription & Access Control

### Subscription Management

- [x] Create subscription application endpoint
- [x] Implement plan selection logic
- [x] Build admin approval workflow
- [x] Create subscription status management
- [ ] Implement grace period logic (monthly plans)
- [x] Add subscription renewal functionality

### QR Code System

- [x] Implement QR code generation
- [x] Create unique token system
- [x] Build QR code validation API
- [x] Implement time-based access logic
- [x] Create access logging system
- [ ] Add capacity management

### Web-Based QR Scanner

- [ ] Create HTML5 camera interface
- [ ] Implement QR code scanning (QuaggaJS/ZXing)
- [ ] Build real-time validation display
- [ ] Add entry/exit logging interface
- [ ] Create responsive scanner UI
- [ ] Test scanner on multiple devices

### Notification System

- [x] Set up email service (Nodemailer)
- [x] Configure SMS service (Twilio/Termii)
- [x] Create notification templates
- [x] Implement subscription approval notifications
- [ ] Add expiration warning notifications
- [ ] Create grace period alerts

## Week 3: Admin Features & Deployment

### Admin Dashboard

- [x] Create admin authentication
- [x] Build user management interface
- [x] Implement payment approval system
- [x] Create subscription management panel
- [x] Add access logs viewing
- [x] Build analytics and reporting
- [x] Implement role-based admin features

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

- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [ ] POST /api/auth/logout
- [x] GET /api/auth/me
- [x] PUT /api/auth/change-password

## User Endpoints

- [x] GET /api/user/profile
- [ ] PUT /api/user/profile
- [x] GET /api/user/subscriptions
- [x] GET /api/user/qr-code
- [x] GET /api/user/access-logs

## Subscription Endpoints

- [x] GET /api/plans
- [x] POST /api/subscriptions/apply
- [x] POST /api/subscriptions/upload-receipt
- [x] GET /api/subscriptions/:id/status
- [x] PUT /api/subscriptions/:id/renew

## Access Control Endpoints

- [x] POST /api/access/validate-qr
- [ ] GET /api/access/current-capacity
- [ ] POST /api/access/manual-entry
- [x] GET /api/access/logs

## Admin Endpoints

- [x] GET /api/admin/pending-payments
- [x] PUT /api/admin/approve-payment/:id
- [x] PUT /api/admin/reject-payment/:id
- [x] GET /api/admin/users
- [x] PUT /api/admin/user-status/:id
- [x] GET /api/admin/subscriptions
- [x] GET /api/admin/access-logs
- [x] GET /api/admin/analytics

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

**Current Status**: ✅ Core Features Implemented
**Next Milestone**: Complete Subscription Logic & Build QR Scanner
**Overall Progress**: 65% Complete

**Last Updated**: August 2, 2025
**Estimated Completion**: August 22, 2025
