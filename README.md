# Employee Productivity & HRM System

## Overview

Employee Productivity & HRM System is a MERN Stack application designed to help organizations manage employees, attendance, productivity tracking, leave requests, and administrative operations from a centralized dashboard.

The system supports role-based access for Admins and Employees, enabling efficient workforce management and performance monitoring.

---

## Features

### Authentication & Authorization

* JWT-based Authentication
* Secure Login & Logout
* Role-Based Access Control (Admin / Employee)
* Protected Routes

### Employee Management

* Employee Profile Management
* Employee Information Storage
* Department & Designation Support
* Employee Status Tracking

### Attendance Management

* Employee Check-In
* Employee Check-Out
* Daily Attendance Tracking
* Late Arrival Detection
* Early Logout Detection
* Weekend Identification
* Attendance History
* Monthly Attendance Reports
* Attendance Summary Dashboard

### Break Management

* Start Break
* End Break
* Break Duration Tracking
* Total Break Hours Calculation

### Leave Management

* Leave Application
* Leave Approval/Rejection
* Leave History
* Leave Status Tracking

### Productivity Tracking

* Daily Work Form Submission
* Employee Activity Monitoring
* Productive Hours Tracking
* Overtime Tracking

### Admin Dashboard

* Employee Overview
* Attendance Statistics
* Leave Statistics
* Productivity Reports
* Employee Monitoring

---

## Tech Stack

### Frontend

* React.js
* Redux Toolkit
* React Router
* Axios
* Tailwind CSS / CSS

### Backend

* Node.js
* Express.js
* JWT Authentication
* Bcrypt.js

### Database

* MongoDB
* Mongoose ODM

---

## Project Structure

```text
Backend/
│
├── config/
│   └── database.js
│
├── controller/
│   ├── authController.js
│   ├── attendanceController.js
│   ├── leaveController.js
│   └── adminController.js
│
├── middleware/
│   ├── auth.js
│   └── isAdmin.js
│
├── model/
│   ├── User.js
│   ├── Attendance.js
│   ├── Leave.js
│   └── BreakLog.js
│
├── routes/
│   ├── authRoutes.js
│   ├── attendanceRoutes.js
│   ├── leaveRoutes.js
│   └── adminRoutes.js
│
└── server.js
```

## Attendance Workflow

### Check-In

Employee logs into the system and performs check-in.

Check-in opens at 07:00 PM in the configured attendance timezone. By default,
the backend uses India time (`Asia/Kolkata`).

System automatically:

* Creates attendance record
* Stores check-in time
* Detects late arrival
* Marks attendance status

### Break Tracking

Employee can:

* Start Break
* End Break

System calculates:

* Break Duration
* Total Break Hours

### Check-Out

Employee performs check-out.

System calculates:

* Total Working Hours
* Productive Hours
* Overtime Hours
* Early Logout Status

---

## Attendance Status Types

* Present
* Absent
* Leave
* Half Day
* Weekend

---

## Security Features

* JWT Authentication
* Password Hashing using Bcrypt
* Protected APIs
* Role-Based Authorization
* Secure Route Access

---

## Environment Variables

Create a `.env` file inside Backend folder:

```env
PORT=5000

MONGODB_URL=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

# Optional. Defaults to Asia/Kolkata.
ATTENDANCE_TZ=Asia/Kolkata
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
```

### Install Backend Dependencies

```bash
cd Backend

npm install
```

### Start Server

```bash
npm run dev
```

---

## Future Enhancements

* Payroll Management
* Salary Slips
* Employee Performance Analytics
* AI Productivity Insights
* Task Management System
* Notification System
* Mobile Application
* Biometric Attendance Integration
* LAN Deployment Support
* Cloud Deployment Support

---

## Author

Chandan Kumar

MERN Stack Developer

Built with Node.js, Express.js, React.js, MongoDB, and JWT Authentication.
