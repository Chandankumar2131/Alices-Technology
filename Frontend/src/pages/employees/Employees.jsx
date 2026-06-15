import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchEmployees,
  createEmployee,
  deactivateEmployee,
  selectEmployee,
} from "../../features/employee/employeeSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import { fmtDate, fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

const empty = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  department: "",
  designation: "",
};

export default function Employees() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector(selectEmployee);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [toDeactivate, setToDeactivate] = useState(null);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      notify.error("First name, last name, email and password are required");
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
    setBusy(true);
    const res = await dispatch(deactivateEmployee(toDeactivate._id));
    setBusy(false);
    if (deactivateEmployee.fulfilled.match(res)) {
      notify.success("Employee deactivated");
      setToDeactivate(null);
    } else notify.error(res.payload);
  };

  const activeCount = list.filter((employee) => employee.isActive).length;
  const inactiveCount = list.length - activeCount;

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <button
          onClick={() => navigate(`/employees/${r._id}`)}
          className="text-left font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
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
        <div className="flex gap-2">
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
              onClick={() => setToDeactivate(r)}
            >
              Deactivate
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
        title="Employees"
        action={<Button onClick={() => setOpen(true)}>+ Add Employee</Button>}
      >
        <Table columns={columns} data={list} loading={loading} emptyText="No employees yet" />
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
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
            <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
          </div>
          <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
          <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Department" name="department" value={form.department} onChange={handleChange} />
            <Input label="Designation" name="designation" value={form.designation} onChange={handleChange} />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        title="Deactivate Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDeactivate(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={confirmDeactivate}>
              Deactivate
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Deactivate <strong className="text-slate-100">{fullName(toDeactivate)}</strong>? They
          won't be able to log in.
        </p>
      </Modal>
    </div>
  );
}

function EmployeeMetric({ label, value, tone = "text-cyan-300" }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
