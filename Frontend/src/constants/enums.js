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

// Submission
export const PORTALS = [
  "LinkedIn",
  "Dice",
  "Indeed",
  "Monster",
  "Naukri",
  "Company Website",
  "Other",
];

export const SUBMISSION_STATUS = [
  "Submitted",
  "Interview Scheduled",
  "Interview Completed",
  "Selected",
  "Rejected",
  "Offer Released",
  "Joined",
];

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
};

// Profile enums
export const GENDERS = ["Male", "Female", "Other"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const MARITAL_STATUS = ["Single", "Married", "Divorced", "Widowed"];

// Badge color maps (Tailwind classes)
export const STATUS_COLORS = {
  // Leave / generic
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  // Attendance
  Present: "bg-green-100 text-green-700",
  Absent: "bg-red-100 text-red-700",
  Leave: "bg-blue-100 text-blue-700",
  "Half Day": "bg-amber-100 text-amber-700",
  Weekend: "bg-gray-100 text-gray-600",
  Holiday: "bg-violet-100 text-violet-700",
  // Payroll
  Paid: "bg-green-100 text-green-700",
  // Submissions
  Submitted: "bg-blue-100 text-blue-700",
  "Interview Scheduled": "bg-indigo-100 text-indigo-700",
  "Interview Completed": "bg-purple-100 text-purple-700",
  Selected: "bg-green-100 text-green-700",
  "Offer Released": "bg-teal-100 text-teal-700",
  Joined: "bg-emerald-100 text-emerald-700",
  // Live status
  Working: "bg-green-100 text-green-700",
  "On Break": "bg-amber-100 text-amber-700",
  "Checked Out": "bg-gray-100 text-gray-600",
  "On Leave": "bg-blue-100 text-blue-700",
};
