import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllPayrolls,
  generatePayroll,
  markPayrollPaid,
  selectPayroll,
} from "../../features/payroll/payrollSlice";
import { fetchEmployees, selectEmployee } from "../../features/employee/employeeSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import EmployeeLink from "../../components/ui/EmployeeLink";
import { fmtMoney, monthName, MONTHS, fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

export default function PayrollAdmin() {
  const dispatch = useDispatch();
  const { allPayrolls, loading } = useSelector(selectPayroll);
  const { list: employees } = useSelector(selectEmployee);
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", month: now.getMonth() + 1, year: now.getFullYear() });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchAllPayrolls());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.employeeId) { notify.error("Select an employee"); return; }
    setBusy(true);
    const res = await dispatch(generatePayroll(form));
    setBusy(false);
    if (generatePayroll.fulfilled.match(res)) {
      notify.success("Payroll generated");
      setOpen(false);
    } else notify.error(res.payload);
  };

  const handleMarkPaid = async (id) => {
    const res = await dispatch(markPayrollPaid(id));
    if (markPayrollPaid.fulfilled.match(res)) notify.success("Marked as paid");
    else notify.error(res.payload);
  };

  const empOptions = [
    { value: "", label: "Select employee..." },
    ...employees.map((e) => ({ value: e._id, label: `${fullName(e)} (${e.employeeId})` })),
  ];
  const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: now.getFullYear() - i, label: String(now.getFullYear() - i) }));

  const columns = [
    { key: "employee", header: "Employee", render: (r) => <EmployeeLink employee={r.employee} /> },
    { key: "period", header: "Period", render: (r) => `${monthName(r.month)} ${r.year}` },
    { key: "presentDays", header: "Present" },
    { key: "halfDays", header: "Half Day", render: (r) => r.halfDays || 0 },
    { key: "absentDays", header: "Absent" },
    { key: "netSalary", header: "Net Salary", render: (r) => fmtMoney(r.netSalary) },
    { key: "paymentStatus", header: "Status", render: (r) => <Badge status={r.paymentStatus} /> },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.paymentStatus === "Paid" ? (
          <span className="text-xs text-gray-400">Paid</span>
        ) : (
          <Button variant="success" className="!px-2 !py-1" onClick={() => handleMarkPaid(r._id)}>Mark Paid</Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="Payroll Management" action={<Button onClick={() => setOpen(true)}>+ Generate Payroll</Button>}>
        <Table columns={columns} data={allPayrolls} loading={loading} emptyText="No payroll generated" />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Generate Payroll"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} loading={busy}>Generate</Button>
          </>
        }
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <Select label="Employee" options={empOptions} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Month" options={monthOptions} value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} />
            <Select label="Year" options={yearOptions} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </div>
          <p className="text-xs text-gray-500">Requires a salary structure for the employee. Absent days are auto-deducted from net salary.</p>
        </form>
      </Modal>
    </div>
  );
}
