import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchEmployees,
  createEmployee,
  deactivateEmployee,
  reactivateEmployee,
  resetEmployeePassword,
  selectEmployee,
} from "../../features/employee/employeeSlice";
import useAuth from "../../hooks/useAuth";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import { fmtDate, fullName } from "../../utils/helpers";
import notify from "../../utils/toast";
import { EMPLOYEE_DEPARTMENTS } from "../../constants/enums";

const empty = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  employeeId: "",
  department: "",
  designation: "",
  joiningDate: "",
};

export default function Employees() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { list, loading } = useSelector(selectEmployee);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [toDeactivate, setToDeactivate] = useState(null);
  const [toReactivate, setToReactivate] = useState(null);
  const [employeeFilter, setEmployeeFilter] = useState("active");
  const [offboarding, setOffboarding] = useState({
    lastWorkingDate: new Date().toISOString().slice(0, 10),
    reason: "",
    remarks: "",
  });
  const [toResetPassword, setToResetPassword] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.employeeId || !form.department || !form.joiningDate) {
      notify.error("First name, last name, email, password, employee ID, department and joining date are required");
      return;
    }
    setBusy(true);
    const res = await dispatch(createEmployee(form));
    setBusy(false);
    if (createEmployee.fulfilled.match(res)) {
      notify.success("Employee created");
      setOpen(false);
      setForm(empty);
    } else notify.error(res.payload);
  };

  const confirmDeactivate = async () => {
    if (!offboarding.lastWorkingDate || !offboarding.reason.trim()) {
      notify.error("Last working date and offboarding reason are required");
      return;
    }
    setBusy(true);
    const res = await dispatch(
      deactivateEmployee({ id: toDeactivate._id, ...offboarding })
    );
    setBusy(false);
    if (deactivateEmployee.fulfilled.match(res)) {
      notify.success("Employee offboarded and their sessions were ended");
      setToDeactivate(null);
      setOffboarding({
        lastWorkingDate: new Date().toISOString().slice(0, 10),
        reason: "",
        remarks: "",
      });
    } else notify.error(res.payload);
  };

  const confirmReactivate = async () => {
    setBusy(true);
    const res = await dispatch(reactivateEmployee(toReactivate._id));
    setBusy(false);
    if (reactivateEmployee.fulfilled.match(res)) {
      notify.success("Employee account reactivated");
      setToReactivate(null);
    } else notify.error(res.payload);
  };

  const confirmResetPassword = async () => {
    if (!temporaryPassword || temporaryPassword.length < 6) {
      notify.error("Temporary password must be at least 6 characters");
      return;
    }

    setBusy(true);
    const res = await dispatch(
      resetEmployeePassword({
        id: toResetPassword._id,
        temporaryPassword,
      })
    );
    setBusy(false);

    if (resetEmployeePassword.fulfilled.match(res)) {
      notify.success("Temporary password set");
      setToResetPassword(null);
      setTemporaryPassword("");
    } else notify.error(res.payload);
  };

  const activeCount = list.filter((employee) => employee.isActive).length;
  const inactiveCount = list.length - activeCount;
  const filteredEmployees = list.filter((employee) => {
    if (employeeFilter === "all") return true;
    return employeeFilter === "active" ? employee.isActive : !employee.isActive;
  });

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <button
          onClick={() => navigate(`/employees/${r._id}`)}
          className="cursor-pointer text-left font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
        >
          <span>{fullName(r)}</span>
          <span className="mt-0.5 block text-xs font-normal text-slate-500">{r.email}</span>
        </button>
      ),
    },
    { key: "employeeId", header: "Emp ID" },
    {
      key: "department",
      header: "Department",
      render: (r) => (
        <span className={r.department ? "text-slate-300" : "text-slate-500"}>
          {r.department || "-"}
        </span>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      render: (r) => (
        <span className={r.designation ? "text-slate-300" : "text-slate-500"}>
          {r.designation || "-"}
        </span>
      ),
    },
    { key: "joiningDate", header: "Joined", render: (r) => fmtDate(r.joiningDate) },
    {
      key: "employmentEndDate",
      header: "Last Working",
      render: (r) => (r.isActive ? "—" : fmtDate(r.employmentEndDate || r.updatedAt)),
    },
    {
      key: "isActive",
      header: "Status",
      render: (r) =>
        r.isActive ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
            Active
          </span>
        ) : (
          <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-0.5 text-xs font-medium text-rose-300">
            Inactive
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="!px-2 !py-1"
            onClick={() => navigate(`/employees/${r._id}`)}
          >
            View
          </Button>
          {r.isActive && (
            <Button
              variant="danger"
              className="!px-2 !py-1"
              onClick={() => {
                setToDeactivate(r);
                setOffboarding({
                  lastWorkingDate: new Date().toISOString().slice(0, 10),
                  reason: "",
                  remarks: "",
                });
              }}
            >
              Offboard
            </Button>
          )}
          {!r.isActive && (
            <Button
              variant="success"
              className="!px-2 !py-1"
              onClick={() => setToReactivate(r)}
            >
              Reactivate
            </Button>
          )}
          {isSuperAdmin && r.isActive && (
            <Button
              variant="secondary"
              className="!px-2 !py-1"
              onClick={() => {
                setToResetPassword(r);
                setTemporaryPassword("");
              }}
            >
              Reset Password
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <EmployeeMetric label="Total Employees" value={list.length} />
        <EmployeeMetric label="Active" value={activeCount} tone="text-emerald-300" />
        <EmployeeMetric label="Inactive" value={inactiveCount} tone="text-rose-300" />
      </div>

      <Card
        title={employeeFilter === "inactive" ? "Archived Employees" : "Employees"}
        action={<Button onClick={() => setOpen(true)}>+ Add Employee</Button>}
      >
        <div className="mb-5 max-w-xs">
          <Select
            label="Employee status"
            value={employeeFilter}
            onChange={(event) => setEmployeeFilter(event.target.value)}
            options={[
              { value: "active", label: "Active employees" },
              { value: "inactive", label: "Archived / inactive" },
              { value: "all", label: "All employees" },
            ]}
          />
        </div>
        <Table
          columns={columns}
          data={filteredEmployees}
          loading={loading}
          emptyText={employeeFilter === "inactive" ? "No archived employees" : "No employees found"}
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={busy}>
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
            <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
          </div>
          <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
          <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} />
          <Input label="Employee ID" name="employeeId" value={form.employeeId} onChange={handleChange} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select label="Department" name="department" value={form.department} onChange={handleChange} options={[{ value: "", label: "Select department" }, ...EMPLOYEE_DEPARTMENTS]} />
            <Input label="Designation" name="designation" value={form.designation} onChange={handleChange} />
          </div>
          <Input
            label="Joining Date"
            type="date"
            name="joiningDate"
            value={form.joiningDate}
            onChange={handleChange}
          />
        </form>
      </Modal>

      <Modal
        open={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        title="Offboard Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDeactivate(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={confirmDeactivate}>
              Complete Offboarding
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Offboard <strong className="text-slate-100">{fullName(toDeactivate)}</strong>?
            Their login and existing sessions will be disabled, while HR history is preserved.
          </p>
          <Input
            label="Last Working Date"
            type="date"
            value={offboarding.lastWorkingDate}
            min={toDeactivate?.joiningDate?.slice(0, 10)}
            onChange={(event) =>
              setOffboarding({ ...offboarding, lastWorkingDate: event.target.value })
            }
          />
          <Input
            label="Reason"
            value={offboarding.reason}
            onChange={(event) => setOffboarding({ ...offboarding, reason: event.target.value })}
            placeholder="Example: Resignation, contract completed"
          />
          <div>
            <label htmlFor="offboarding-remarks" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
              Remarks (optional)
            </label>
            <textarea
              id="offboarding-remarks"
              rows={3}
              value={offboarding.remarks}
              onChange={(event) => setOffboarding({ ...offboarding, remarks: event.target.value })}
              className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
              placeholder="Add handover or administrative notes"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!toReactivate}
        onClose={() => setToReactivate(null)}
        title="Reactivate Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToReactivate(null)}>
              Cancel
            </Button>
            <Button variant="success" loading={busy} onClick={confirmReactivate}>
              Reactivate
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Reactivate <strong className="text-slate-100">{fullName(toReactivate)}</strong>?
          They will be allowed to sign in again with their existing password.
        </p>
      </Modal>

      <Modal
        open={!!toResetPassword}
        onClose={() => {
          setToResetPassword(null);
          setTemporaryPassword("");
        }}
        title="Reset Employee Password"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setToResetPassword(null);
                setTemporaryPassword("");
              }}
            >
              Cancel
            </Button>
            <Button loading={busy} onClick={confirmResetPassword}>
              Set Temporary Password
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Set a temporary password for{" "}
            <strong className="text-slate-100">{fullName(toResetPassword)}</strong>. Share it
            with the employee so they can log in and change it from their profile.
          </p>
          <Input
            label="Temporary Password"
            type="password"
            value={temporaryPassword}
            onChange={(e) => setTemporaryPassword(e.target.value)}
            placeholder="Minimum 6 characters"
          />
        </div>
      </Modal>
    </div>
  );
}

function EmployeeMetric({ label, value, tone = "text-cyan-300" }) {
  return (
    <div className="theme-employee-metric rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
