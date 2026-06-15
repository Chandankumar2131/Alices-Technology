import api, { unwrap, downloadBlob } from "../lib/api";

export const payrollService = {
  getMyPayroll: () => api.get("/payroll/my-payroll").then(unwrap),
  downloadPayslip: (payrollId, month, year) =>
    downloadBlob(`/payroll/payslip/${payrollId}`, `payslip-${month}-${year}.pdf`),
  // Admin
  generate: (payload) => api.post("/payroll/generate", payload).then(unwrap),
  getAll: () => api.get("/payroll/all").then(unwrap),
  getEmployeePayroll: (employeeId) =>
    api.get(`/payroll/employee/${employeeId}`).then(unwrap),
  markPaid: (payrollId) =>
    api.patch(`/payroll/pay/${payrollId}`).then(unwrap),
};
