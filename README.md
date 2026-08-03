# Employee Productivity & HRM System

Complete documentation for the HRM project developed for Alice's Tech Solutions.

## 1. Project Overview

Employee Productivity & HRM System is a MERN stack workforce management application. It helps an organization manage employees, attendance, breaks, leave requests, salary structures, payroll, holidays, reports, profile information, and internal chat from one secured portal.

The project is divided into two main applications:

- `Backend`: Node.js, Express, MongoDB, Socket.IO, JWT authentication, payroll PDF generation, rate limiting, and background attendance jobs.
- `Frontend`: React, Vite, Redux Toolkit, React Router, Axios, Socket.IO client, and Tailwind CSS.

## 2. Main Features

### Authentication and Authorization

- JWT-based login.
- Cookie-based token storage.
- Logout support.
- Protected frontend routes.
- API authentication middleware.
- Role-based access for `Employee`, `Admin`, and `SuperAdmin`.
- Super admin can create admins and reset employee passwords.

### Employee Management

- Admin employee creation.
- Employee listing.
- Employee profile view.
- Employee deactivation.
- Department, designation, employee ID, joining date, and active status.
- Extended personal profile details such as address, contact number, emergency contact, blood group, marital status, and date of birth.

### Attendance Management

- Employee check-in and check-out.
- Night-shift attendance date handling.
- Check-in window from 07:00 PM to 07:10 PM.
- Full-day check-in limit at 08:00 PM.
- Standard checkout time at 04:00 AM.
- Automatic checkout at 05:00 AM.
- Late arrival detection.
- Early logout detection.
- Productive hour calculation.
- Break hour calculation.
- Overtime calculation.
- Attendance calendar.
- Monthly attendance.
- Attendance summary.
- Admin attendance views.
- Employee day detail.
- Attendance correction requests.
- Admin approval and rejection of correction requests.
- Admin override to mark half day as present.

### Break Management

- Start break.
- End break.
- Active break protection.
- Break reason tracking.
- Break duration calculation.
- Today's break list.
- Employee break history.

### Leave Management

- Apply for leave.
- Leave types:
  - Casual Leave
  - Sick Leave
  - Emergency Leave
  - Paid Leave
  - Unpaid Leave
- Leave status:
  - Pending
  - Approved
  - Rejected
- Admin approval.
- Admin rejection.
- Employee leave history.
- Admin leave request list.

### Dashboard and Reports

- Admin dashboard.
- Employee dashboard.
- Live employee tracking.
- Department analytics.
- Today's attendance.
- Employees currently on break.
- Late employees.
- Employee timeline.
- Employee day detail.
- Reports page in the frontend.

### Salary Management

- Admin salary structure creation.
- Admin salary structure update.
- Employee salary view.
- Salary components:
  - Basic salary
  - HRA
  - Special allowance
  - Bonus
  - PF
  - Professional tax
  - Other deductions
  - Gross salary
  - Net salary
  - Effective date

### Payroll Management

- Admin payroll generation.
- Employee payroll history.
- Admin all-payroll view.
- Admin employee-wise payroll view.
- Mark payroll as paid.
- Payslip PDF download.
- Payroll considers attendance, present days, half days, leave days, holidays, absent days, overtime, gross salary, deductions, and net salary.

### Holiday Management

- Admin holiday creation.
- Holiday list visible to authenticated users.
- Admin holiday deletion.
- Unique holiday date validation.

### Internal Chat

- User list for chat.
- Direct conversations.
- Group conversations.
- Group creation.
- Group member updates.
- Group deletion.
- Message sending.
- Attachment upload through Cloudinary.
- Conversation read state.
- Socket.IO real-time messaging support.

### System and Operations

- Health endpoint.
- Request metrics endpoint.
- Rate limiting.
- Helmet security headers.
- Response compression.
- CORS configuration.
- Background auto-checkout job.
- Load-test script.

## 3. User Roles

### Employee

Employees can:

- Login and logout.
- View dashboard.
- Check in and check out.
- Start and end breaks.
- View attendance history.
- Request attendance correction.
- Apply for leave.
- View own leave history.
- View salary structure.
- View payroll and download payslips.
- Manage profile.
- Use chat.

### Admin

Admins can do everything employees can, plus:

- Create employees.
- View employee list.
- View employee details.
- Deactivate employees.
- Manage attendance.
- View attendance correction requests.
- Approve or reject attendance corrections.
- Manage leave approvals.
- Manage salary structures.
- Generate payroll.
- Mark payroll as paid.
- Manage holidays.
- View reports and analytics.

### SuperAdmin

Super admins can do everything admins can, plus:

- Create admin users.
- Reset employee passwords.

## 4. Technology Stack

### Frontend

- React 19
- Vite
- Redux Toolkit
- React Redux
- React Router DOM
- Axios
- Socket.IO Client
- React Hot Toast
- Tailwind CSS
- Vercel Analytics
- ESLint

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- JWT
- Bcrypt
- Cookie Parser
- CORS
- Helmet
- Compression
- Express Rate Limit
- Socket.IO
- Moment Timezone
- Nodemailer
- Cloudinary
- PDFKit
- Nodemon

### Database

- MongoDB with Mongoose ODM.

## 5. Project Structure

```text
.
├── Backend
│   ├── assets
│   ├── config
│   │   ├── cloudinary.js
│   │   └── database.js
│   ├── controller
│   │   ├── adminController.js
│   │   ├── attendanceController.js
│   │   ├── authController.js
│   │   ├── breakController.js
│   │   ├── chatController.js
│   │   ├── dashboardController.js
│   │   ├── holidayController.js
│   │   ├── leaveController.js
│   │   ├── payrollController.js
│   │   └── salaryController.js
│   ├── middleware
│   │   ├── auth.js
│   │   ├── isAdmin.js
│   │   ├── isSuperAdmin.js
│   │   ├── rateLimiters.js
│   │   └── requestMetrics.js
│   ├── model
│   │   ├── Attendance.js
│   │   ├── AttendanceCorrection.js
│   │   ├── BreakLog.js
│   │   ├── Conversation.js
│   │   ├── Holiday.js
│   │   ├── Leave.js
│   │   ├── Message.js
│   │   ├── Payroll.js
│   │   ├── Profile.js
│   │   ├── SalaryStructure.js
│   │   └── User.js
│   ├── routes
│   │   ├── attendanceRoutes.js
│   │   ├── authRoutes.js
│   │   ├── breakRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── holidayRoutes.js
│   │   ├── leaveRoutes.js
│   │   ├── payrollRoutes.js
│   │   └── salaryRoutes.js
│   ├── scripts
│   │   ├── createAdmin.js
│   │   └── loadTest.js
│   ├── utils
│   │   ├── attendanceEvents.js
│   │   ├── attendanceShift.js
│   │   ├── autoCheckout.js
│   │   ├── mailSender.js
│   │   ├── pagination.js
│   │   └── socket.js
│   ├── package.json
│   └── server.js
├── Frontend
│   ├── public
│   ├── src
│   │   ├── app
│   │   ├── assets
│   │   ├── components
│   │   ├── constants
│   │   ├── features
│   │   ├── hooks
│   │   ├── lib
│   │   ├── pages
│   │   ├── routes
│   │   ├── service
│   │   ├── utils
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── package.json
└── README.md
```

## 6. Installation

### Prerequisites

- Node.js
- npm
- MongoDB database
- Cloudinary account, required for chat attachments
- SMTP credentials, required if mail sending is used

### Install Root Dependencies

```bash
npm install
```

### Install Backend Dependencies

```bash
cd Backend
npm install
```

### Install Frontend Dependencies

```bash
cd Frontend
npm install
```

## 7. Environment Variables

Create `Backend/.env`:

```env
PORT=4000
NODE_ENV=development
MONGODB_URL=mongodb://127.0.0.1:27017/hrm
JWT_SECRET=replace_with_strong_secret
FRONTEND_URL=http://localhost:5173

ATTENDANCE_TZ=Asia/Kolkata

# Server-side AI assistant (never expose this key through VITE_* variables)
OPENAI_API_KEY=your_openai_project_api_key
OPENAI_MODEL=gpt-5.6-sol
AI_RATE_LIMIT=20

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password

SUPER_ADMIN_FIRSTNAME=Super
SUPER_ADMIN_LASTNAME=Admin
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=StrongPassword123
SUPER_ADMIN_DEPARTMENT=Management
SUPER_ADMIN_DESIGNATION=Super Admin
SUPER_ADMIN_EMPLOYEE_ID=SA001
```

Create `Frontend/.env` if the API or socket URLs differ from local defaults:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

## 8. Running the Project

### Run Backend Only

```bash
npm run server
```

This runs:

```bash
cd Backend && npm run dev
```

Backend default URL:

```text
http://localhost:4000
```

### Run Frontend Only

```bash
npm run client
```

This runs:

```bash
cd Frontend && npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

### Run Backend and Frontend Together

```bash
npm run dev
```

The root script uses `concurrently` to start both applications.

### Production Backend Start

```bash
cd Backend
npm start
```

### Frontend Build

```bash
cd Frontend
npm run build
```

### Frontend Preview

```bash
cd Frontend
npm run preview
```

## 9. Initial Super Admin Setup

After configuring `Backend/.env`, create the first super admin:

```bash
cd Backend
node scripts/createAdmin.js
```

The script:

- Connects to MongoDB.
- Checks whether the configured super admin email already exists.
- Creates an empty profile.
- Hashes the password.
- Creates a `SuperAdmin` user.

## 10. Frontend Routes

### Public Route

| Route | Page | Access |
| --- | --- | --- |
| `/login` | Login | Public |

### Authenticated Routes

| Route | Page | Access |
| --- | --- | --- |
| `/dashboard` | Dashboard | Employee, Admin, SuperAdmin |
| `/attendance` | My Attendance | Employee, Admin, SuperAdmin |
| `/attendance/:date` | Employee Day Attendance | Authenticated |
| `/leaves` | My Leaves | Employee |
| `/payroll` | My Payroll | Employee |
| `/salary` | My Salary | Employee |
| `/profile` | Profile | Employee, Admin, SuperAdmin |
| `/chat` | Chat | Employee, Admin, SuperAdmin |

### Admin Routes

| Route | Page | Access |
| --- | --- | --- |
| `/employees` | Employees | Admin, SuperAdmin |
| `/employees/:id` | Employee Detail | Admin, SuperAdmin |
| `/employees/:id/attendance/:date` | Employee Day Attendance | Admin, SuperAdmin |
| `/leaves/manage` | Leave Admin | Admin, SuperAdmin |
| `/attendance/corrections` | Attendance Corrections Admin | Admin, SuperAdmin |
| `/payroll/manage` | Payroll Admin | Admin, SuperAdmin |
| `/salary/manage` | Salary Admin | Admin, SuperAdmin |
| `/reports` | Reports | Admin, SuperAdmin |
| `/holidays` | Holidays | Admin, SuperAdmin |

### Super Admin Routes

| Route | Page | Access |
| --- | --- | --- |
| `/admins/create` | Create Admin | SuperAdmin |

## 11. API Reference

Base API URL:

```text
/api/v1
```

### Auth API

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Login user |
| `POST` | `/auth/logout` | Public | Logout user |
| `POST` | `/auth/create-employee` | Admin | Create employee |
| `GET` | `/auth/employees` | Admin | List employees |
| `PATCH` | `/auth/deactivate/:id` | Admin | Deactivate employee |
| `POST` | `/auth/reset-employee-password/:id` | SuperAdmin | Reset employee password |
| `POST` | `/auth/create-admin` | SuperAdmin | Create admin |
| `GET` | `/auth/profile` | Authenticated | Get own profile |
| `PUT` | `/auth/profile/update` | Authenticated | Update account profile |
| `PUT` | `/auth/profile/details` | Authenticated | Update additional profile details |
| `POST` | `/auth/change-password` | Authenticated | Change own password |

### Attendance API

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/attendance/checkin` | Authenticated | Check in |
| `POST` | `/attendance/checkout` | Authenticated | Check out |
| `GET` | `/attendance/my-attendance` | Authenticated | Get own attendance history |
| `GET` | `/attendance/month` | Authenticated | Get monthly attendance calendar |
| `GET` | `/attendance/summary` | Authenticated | Get attendance summary |
| `POST` | `/attendance/corrections` | Authenticated | Request check-in correction |
| `GET` | `/attendance/corrections/my` | Authenticated | Get own correction requests |
| `GET` | `/attendance/all` | Admin | Get all attendance records |
| `GET` | `/attendance/employee/:employeeId` | Admin | Get employee attendance |
| `GET` | `/attendance/corrections/all` | Admin | Get all correction requests |
| `PATCH` | `/attendance/corrections/approve/:requestId` | Admin | Approve correction |
| `PATCH` | `/attendance/corrections/reject/:requestId` | Admin | Reject correction |
| `PATCH` | `/attendance/override/mark-present/:attendanceId` | Admin | Mark half day as present |

### Break API

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/break/start` | Authenticated | Start a break |
| `POST` | `/break/end` | Authenticated | End active break |
| `GET` | `/break/my-breaks` | Authenticated | Get own break history |
| `GET` | `/break/today` | Authenticated | Get today's breaks |

### Leave API

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/leave/apply` | Authenticated | Apply for leave |
| `GET` | `/leave/my-leaves` | Authenticated | Get own leaves |
| `GET` | `/leave/all` | Admin | Get all leave requests |
| `PATCH` | `/leave/approve/:leaveId` | Admin | Approve leave |
| `PATCH` | `/leave/reject/:leaveId` | Admin | Reject leave |
| `GET` | `/leave/:leaveId` | Authenticated | Get leave by ID |

### Salary API

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/salary/create` | Admin | Create salary structure |
| `PUT` | `/salary/update/:employeeId` | Admin | Update salary structure |
| `GET` | `/salary/my-salary` | Authenticated | Get own salary structure |
| `GET` | `/salary/:employeeId` | Admin | Get employee salary structure |

### Payroll API

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/payroll/my-payroll` | Authenticated | Get own payroll history |
| `POST` | `/payroll/generate` | Admin | Generate payroll |
| `GET` | `/payroll/all` | Admin | Get all payroll records |
| `GET` | `/payroll/employee/:employeeId` | Admin | Get employee payroll |
| `PATCH` | `/payroll/pay/:payrollId` | Admin | Mark payroll as paid |
| `GET` | `/payroll/payslip/:payrollId` | Authenticated | Download payslip PDF |

### Dashboard API

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/dashboard/admin` | Admin | Get admin dashboard |
| `GET` | `/dashboard/live-employees` | Admin | Get live employees |
| `GET` | `/dashboard/employee/:employeeId` | Admin | Get employee dashboard |
| `GET` | `/dashboard/department-analytics` | Admin | Get department analytics |
| `GET` | `/dashboard/today-attendance` | Admin | Get today's attendance |
| `GET` | `/dashboard/on-break` | Admin | Get employees on break |
| `GET` | `/dashboard/late-employees` | Admin | Get late employees |
| `GET` | `/dashboard/employee/:employeeId/timeline` | Admin | Get employee timeline |
| `GET` | `/dashboard/employee/:employeeId/day/:date` | Admin | Get employee day detail |
| `GET` | `/dashboard/employee-dashboard` | Authenticated | Get own dashboard |
| `GET` | `/dashboard/employee-dashboard/day/:date` | Authenticated | Get own day detail |
| `GET` | `/dashboard/employee/:employeeId/detail` | Admin | Get employee detail |

### Holiday API

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/holiday` | Authenticated | List holidays |
| `POST` | `/holiday` | Admin | Create holiday |
| `DELETE` | `/holiday/:id` | Admin | Delete holiday |

### Chat API

All chat routes require authentication.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/chat/users` | List users available for chat |
| `GET` | `/chat/conversations` | List conversations |
| `POST` | `/chat/groups` | Create group |
| `PATCH` | `/chat/groups/:conversationId/members` | Update group members |
| `DELETE` | `/chat/groups/:conversationId` | Delete group |
| `GET` | `/chat/messages/direct/:userId` | Get direct messages |
| `GET` | `/chat/messages/conversation/:conversationId` | Get group conversation messages |
| `POST` | `/chat/attachments` | Upload attachment |
| `POST` | `/chat/messages` | Send message |
| `PATCH` | `/chat/messages/:userId/read` | Mark direct conversation read |
| `PATCH` | `/chat/conversations/:conversationId/read` | Mark group conversation read |

### System API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Backend status message |
| `GET` | `/health` | Health check with uptime |
| `GET` | `/metrics` | Request metrics |

## 12. Database Models

### User

Stores login and employee account data.

Important fields:

- `firstName`
- `lastName`
- `email`
- `password`
- `accountType`
- `additionalDetails`
- `image`
- `isActive`
- `department`
- `designation`
- `employeeId`
- `joiningDate`
- `lastLogin`
- `lastLogout`

Roles:

- `SuperAdmin`
- `Admin`
- `Employee`

### Profile

Stores extended profile data:

- `gender`
- `dateOfBirth`
- `contactNumber`
- `address`
- `city`
- `state`
- `country`
- `pincode`
- `bloodGroup`
- `maritalStatus`
- `emergencyContactName`
- `emergencyContactNumber`

### Attendance

Stores daily attendance:

- `employee`
- `date`
- `attendanceDate`
- `dayName`
- `isWeekend`
- `checkIn`
- `checkOut`
- `breakLogs`
- `totalHours`
- `breakHours`
- `productiveHours`
- `overtimeHours`
- `lateArrival`
- `earlyLogout`
- `status`
- `attendanceSource`
- `remarks`
- `statusOverride`
- `systemStatus`
- `overrideBy`
- `overrideAt`
- `overrideReason`

Attendance statuses:

- `Present`
- `Absent`
- `Leave`
- `Half Day`
- `Weekend`
- `Holiday`

### AttendanceCorrection

Stores check-in correction requests:

- `employee`
- `attendance`
- `currentCheckIn`
- `requestedCheckIn`
- `reason`
- `status`
- `approvedBy`
- `approvedAt`
- `adminRemarks`

Statuses:

- `Pending`
- `Approved`
- `Rejected`

### BreakLog

Stores break sessions:

- `attendance`
- `employee`
- `breakStart`
- `breakEnd`
- `duration`
- `reason`
- `status`

Break reasons:

- `Lunch`
- `Tea`
- `Personal`
- `Meeting`
- `Other`

Statuses:

- `Active`
- `Completed`

### Leave

Stores leave requests:

- `employee`
- `leaveType`
- `startDate`
- `endDate`
- `totalDays`
- `reason`
- `status`
- `approvedBy`
- `approvedAt`
- `adminRemarks`

### SalaryStructure

Stores salary components per employee:

- `employee`
- `basicSalary`
- `hra`
- `specialAllowance`
- `bonus`
- `pf`
- `professionalTax`
- `otherDeductions`
- `grossSalary`
- `netSalary`
- `effectiveFrom`
- `createdBy`

### Payroll

Stores generated payroll:

- `employee`
- `salaryStructure`
- `month`
- `year`
- `workingDays`
- `presentDays`
- `halfDays`
- `leaveDays`
- `holidayDays`
- `absentDays`
- `overtimeHours`
- `grossSalary`
- `deductions`
- `netSalary`
- `generatedAt`
- `paymentStatus`
- `paidAt`

Payment statuses:

- `Pending`
- `Paid`

### Holiday

Stores company holidays:

- `name`
- `date`
- `description`
- `createdBy`

### Conversation

Stores chat conversations:

- `type`
- `name`
- `createdBy`
- `participants`
- `lastMessage`
- `lastMessageAt`

Conversation types:

- `direct`
- `group`

### Message

Stores chat messages:

- `conversation`
- `sender`
- `receiver`
- `receivers`
- `text`
- `attachments`
- `readAt`
- `readBy`

## 13. Attendance Workflow

### Shift Configuration

The attendance system is configured in `Backend/utils/attendanceShift.js`.

Default timezone:

```text
Asia/Kolkata
```

Shift timings:

| Setting | Time |
| --- | --- |
| Check-in start | 07:00 PM |
| Check-in end | 07:10 PM |
| Full-day check-in limit | 08:00 PM |
| Checkout time | 04:00 AM |
| Auto-checkout time | 05:00 AM |
| Half-day minimum productive hours | 4 hours |
| Full-day minimum productive hours | 7 hours 20 minutes |

### Check-In

When an employee checks in:

1. The backend identifies the correct shift date.
2. Attendance is created or updated for that date.
3. Check-in time is saved.
4. Late arrival is detected.
5. Initial attendance status is assigned.

### Breaks

When an employee starts a break:

1. A `BreakLog` record is created.
2. The break status is set to `Active`.
3. The system prevents more than one active break for the same employee.

When an employee ends a break:

1. `breakEnd` is saved.
2. Duration is calculated in minutes.
3. Break status changes to `Completed`.
4. Attendance break hours are updated.

### Check-Out

When an employee checks out:

1. Check-out time is saved.
2. Total hours are calculated.
3. Break hours are subtracted.
4. Productive hours are calculated.
5. Overtime hours are calculated.
6. Final attendance status is calculated.

### Auto Checkout

The backend starts an auto-checkout job when the server starts. The job runs every five minutes and checks for open attendance records. Any open attendance that passes the configured auto-checkout time is closed automatically.

## 14. Payroll Workflow

1. Admin creates or updates the employee salary structure.
2. Admin generates payroll for an employee, month, and year.
3. Backend reads attendance, leave, holiday, overtime, and salary data.
4. Backend calculates gross salary, deductions, and net salary.
5. Payroll record is stored.
6. Admin can mark payroll as paid.
7. Employee can view payroll and download payslip PDF.

## 15. Frontend Architecture

### Core Frontend Files

- `Frontend/src/main.jsx`: React application entry point.
- `Frontend/src/App.jsx`: Main app component.
- `Frontend/src/routes/AppRoutes.jsx`: Application route definitions.
- `Frontend/src/routes/ProtectedRoute.jsx`: Authenticated route protection.
- `Frontend/src/routes/RoleRoute.jsx`: Role-based route protection.
- `Frontend/src/app/store.js`: Redux store setup.
- `Frontend/src/lib/api.js`: Axios API client.
- `Frontend/src/lib/socket.js`: Socket.IO client setup.

### Feature Slices

Redux slices are organized by feature:

- `auth`
- `attendance`
- `break`
- `dashboard`
- `employee`
- `leave`
- `payroll`
- `salary`

### Services

Frontend API wrappers are in `Frontend/src/service`:

- `authService.js`
- `attendanceService.js`
- `breakService.js`
- `chatService.js`
- `dashboardService.js`
- `holidayService.js`
- `leaveService.js`
- `payrollService.js`
- `salaryService.js`

### Layout Components

- `AppLayout`
- `Header`
- `Sidebar`

### Common UI Components

- `Badge`
- `Button`
- `Card`
- `EmptyState`
- `EmployeeLink`
- `Input`
- `Modal`
- `Select`
- `Spinner`
- `StatCard`
- `Table`
- `ThemeToggle`

## 16. Backend Architecture

### Server Startup

`Backend/server.js` performs these tasks:

1. Loads environment variables from `Backend/.env`.
2. Creates the Express app.
3. Configures JSON parsing.
4. Enables cookie parsing.
5. Enables security headers through Helmet.
6. Enables compression.
7. Enables request metrics.
8. Configures CORS.
9. Applies API rate limiters.
10. Connects to MongoDB.
11. Registers API routes.
12. Registers health and metrics endpoints.
13. Creates an HTTP server.
14. Initializes Socket.IO.
15. Starts the auto-checkout job.
16. Starts listening on `PORT`.

### Middleware

- `auth.js`: Verifies JWT and attaches authenticated user.
- `isAdmin.js`: Allows admin-level access.
- `isSuperAdmin.js`: Allows super-admin-only access.
- `rateLimiters.js`: Applies standard, auth, and write rate limits.
- `requestMetrics.js`: Tracks request metrics.

### Utilities

- `attendanceShift.js`: Attendance timezone and shift rules.
- `autoCheckout.js`: Auto-checkout background job.
- `attendanceEvents.js`: Attendance-related event helpers.
- `socket.js`: Socket.IO initialization and authentication.
- `pagination.js`: Pagination helper.
- `mailSender.js`: SMTP mail helper.

## 17. Security Notes

- Passwords are hashed with Bcrypt.
- JWT secret must be strong and private.
- Auth token fields are excluded from JSON output.
- Password fields are excluded from normal user queries.
- Helmet adds common security headers.
- CORS should be restricted with `FRONTEND_URL` in production.
- Cookies use `secure` and `sameSite: none` when `NODE_ENV=production`.
- API rate limiters protect common endpoints.
- Cloudinary credentials must not be committed.
- `.env` files must not be committed.

## 18. Deployment Notes

### Backend Deployment

1. Set production environment variables.
2. Set `NODE_ENV=production`.
3. Set `FRONTEND_URL` to the deployed frontend domain.
4. Use a production MongoDB URL.
5. Configure Cloudinary credentials.
6. Configure SMTP credentials if email is required.
7. Run:

```bash
cd Backend
npm install
npm start
```

### Frontend Deployment

1. Set `VITE_API_URL` to the deployed backend API URL.
2. Set `VITE_SOCKET_URL` to the deployed backend root URL.
3. Build the frontend:

```bash
cd Frontend
npm install
npm run build
```

4. Deploy the generated `dist` folder.

## 19. Available Scripts

### Root

| Script | Description |
| --- | --- |
| `npm run client` | Starts frontend dev server |
| `npm run server` | Starts backend dev server |
| `npm run dev` | Starts frontend and backend together |

### Backend

| Script | Description |
| --- | --- |
| `npm start` | Starts backend with Node |
| `npm run dev` | Starts backend with Nodemon |
| `npm run load:test` | Runs load-test script |
| `npm test` | Placeholder test script |

### Frontend

| Script | Description |
| --- | --- |
| `npm run dev` | Starts Vite dev server |
| `npm run build` | Builds frontend |
| `npm run lint` | Runs ESLint |
| `npm run preview` | Previews production build |

## 20. Load Testing

Backend includes `Backend/scripts/loadTest.js`.

Useful environment variables:

```env
TARGET_URL=http://localhost:4000/health
REQUESTS=200
CONCURRENCY=20
```

Run:

```bash
cd Backend
npm run load:test
```

## 21. Troubleshooting

### Backend Cannot Connect to Database

Check:

- `MONGODB_URL` is present in `Backend/.env`.
- MongoDB is running.
- The database user has correct permissions.
- Network access is allowed if using MongoDB Atlas.

### Login Fails

Check:

- User exists in MongoDB.
- Password is correct.
- `JWT_SECRET` is configured.
- Browser allows cookies.
- `FRONTEND_URL` matches the frontend origin.

### Frontend Cannot Reach Backend

Check:

- Backend is running on the configured port.
- `VITE_API_URL` points to `/api/v1`.
- CORS allows the frontend origin.
- Browser console does not show network or CORS errors.

### Chat Attachments Fail

Check:

- `CLOUDINARY_CLOUD_NAME` is configured.
- `CLOUDINARY_API_KEY` is configured.
- `CLOUDINARY_API_SECRET` is configured.

### Payslip Download Fails

Check:

- Payroll record exists.
- User is authenticated.
- Backend route `/api/v1/payroll/payslip/:payrollId` is reachable.
- Browser is not blocking file downloads.

### Attendance Date Looks Wrong

Check:

- `ATTENDANCE_TZ` is correct.
- The project uses a night shift cutoff around 05:00 AM.
- Attendance before the cutoff can belong to the previous shift date.

## 22. Recommended Future Enhancements

- Automated test coverage for controllers and services.
- API documentation with request and response examples.
- Swagger or OpenAPI generation.
- Audit logs for admin actions.
- Employee import from CSV.
- Notification center.
- Email notifications for leave and payroll actions.
- Mobile app support.
- Biometric attendance integration.
- Advanced analytics dashboards.
- Role permission customization.

## 23. Author

Chandan Kumar

MERN Stack Developer

Built with Node.js, Express, React, MongoDB, JWT authentication, Redux Toolkit, Socket.IO, and Tailwind CSS.
