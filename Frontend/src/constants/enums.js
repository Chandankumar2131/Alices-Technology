// Leave
export const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Paid Leave",
  "Unpaid Leave",
];

export const LEAVE_STATUS = ["Pending", "Approved", "Rejected"];

// Break
export const BREAK_REASONS = ["Lunch", "Tea", "Personal", "Meeting", "Other"];

// Attendance
export const ATTENDANCE_STATUS = [
  "Present",
  "Absent",
  "Leave",
  "Half Day",
  "Weekend",
  "Holiday",
];

// Payroll
export const PAYMENT_STATUS = ["Pending", "Paid"];

// Roles
export const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
  CANDIDATE: "Candidate",
};

export const SUBSCRIPTION_STATUSES = ["Trial", "Active", "Expiring Soon", "Expired", "Paused", "Cancelled"];
export const RESUME_STATUSES = ["Details Pending", "Resume In Progress", "Ready", "Revision Requested", "Approved"];
export const JOB_PORTALS = ["LinkedIn", "Naukri", "Indeed", "Dice", "Monster", "ZipRecruiter", "Company Website", "Other"];
export const JOB_APPLICATION_STATUSES = ["Applied", "Recruiter Response", "Interview Scheduled", "Rejected", "Selected", "Withdrawn"];

// Profile enums
export const GENDERS = ["Male", "Female", "Other"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const MARITAL_STATUS = ["Single", "Married", "Divorced", "Widowed"];
export const EMPLOYEE_DEPARTMENTS = ["IT", "Marketing", "Lead Generation", "Sales"];

// Badge color maps (Tailwind classes)
export const STATUS_COLORS = {
  // Leave / generic
  Pending: "bg-amber-100 text-amber-700",
  Submitted: "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  "Pending Review": "bg-amber-100 text-amber-700",
  Verified: "bg-green-100 text-green-700",
  "Replacement Requested": "bg-violet-100 text-violet-700",
  // Attendance
  Present: "bg-green-100 text-green-700",
  Absent: "bg-red-100 text-red-700",
  Leave: "bg-blue-100 text-blue-700",
  "Half Day": "bg-amber-100 text-amber-700",
  Weekend: "bg-gray-100 text-gray-600",
  Holiday: "bg-violet-100 text-violet-700",
  // Payroll
  Paid: "bg-green-100 text-green-700",
  Selected: "bg-green-100 text-green-700",
  Active: "bg-green-100 text-green-700",
  Trial: "bg-blue-100 text-blue-700",
  "Expiring Soon": "bg-amber-100 text-amber-700",
  Expired: "bg-red-100 text-red-700",
  Paused: "bg-gray-100 text-gray-600",
  Cancelled: "bg-red-100 text-red-700",
  Applied: "bg-blue-100 text-blue-700",
  New: "bg-blue-100 text-blue-700",
  Forwarded: "bg-violet-100 text-violet-700",
  Contacted: "bg-cyan-100 text-cyan-700",
  "Follow Up": "bg-amber-100 text-amber-700",
  Converted: "bg-green-100 text-green-700",
  "Follow-UP": "bg-amber-100 text-amber-700",
  Closed: "bg-green-100 text-green-700",
  "Not Interested": "bg-red-100 text-red-700",
  "Call Not pickup": "bg-gray-100 text-gray-700",
  Reschedule: "bg-sky-100 text-sky-700",
  "Meeting Scheduled": "bg-blue-100 text-blue-700",
  "call scheduled": "bg-purple-100 text-purple-700",
  "Recruiter Response": "bg-violet-100 text-violet-700",
  "Interview Scheduled": "bg-amber-100 text-amber-700",
  Withdrawn: "bg-gray-100 text-gray-600",
  // Live status
  Working: "bg-green-100 text-green-700",
  "On Break": "bg-amber-100 text-amber-700",
  "Checked Out": "bg-gray-100 text-gray-600",
  "On Leave": "bg-blue-100 text-blue-700",
};
