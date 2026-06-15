import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createSalary,
  clearSelectedSalary,
  fetchEmployeeSalary,
  selectSalary,
  updateSalary,
} from "../../features/salary/salarySlice";
import { fetchEmployees, selectEmployee } from "../../features/employee/employeeSlice";
import { salaryService } from "../../service/salaryService";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import EmployeeLink from "../../components/ui/EmployeeLink";
import { fmtMoney, fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

const emptyForm = {
  basicSalary: "",
  hra: "",
  specialAllowance: "",
  bonus: "",
  pf: "",
  professionalTax: "",
  otherDeductions: "",
};

const moneyFields = [
  ["basicSalary", "Basic Salary"],
  ["hra", "HRA"],
  ["specialAllowance", "Special Allowance"],
  ["bonus", "Bonus"],
  ["pf", "Provident Fund"],
  ["professionalTax", "Professional Tax"],
  ["otherDeductions", "Other Deductions"],
];

export default function SalaryAdmin() {
  const dispatch = useDispatch();
  const { list: employees, loading: employeesLoading } = useSelector(selectEmployee);
  const { selected, loading: salaryLoading } = useSelector(selectSalary);
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [salaryByEmployee, setSalaryByEmployee] = useState({});
  const [salaryListLoading, setSalaryListLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  useEffect(() => {
    if (!employees.length) {
      return;
    }

    let active = true;
    const loadSalaries = async () => {
      setSalaryListLoading(true);
      const entries = await Promise.all(
        employees.map(async (employee) => {
          try {
            const res = await salaryService.getByEmployee(employee._id);
            return [employee._id, res.data || null];
          } catch {
            return [employee._id, null];
          }
        })
      );

      if (active) {
        setSalaryByEmployee(Object.fromEntries(entries));
        setSalaryListLoading(false);
      }
    };

    loadSalaries();

    return () => {
      active = false;
    };
  }, [employees]);

  const employeeOptions = useMemo(
    () => [
      { value: "", label: "Select employee..." },
      ...employees.map((employee) => ({
        value: employee._id,
        label: `${fullName(employee)} (${employee.employeeId || "No ID"})`,
      })),
    ],
    [employees]
  );

  const selectedEmployee = employees.find((employee) => employee._id === employeeId);

  const openEditor = async (employee) => {
    setEmployeeId(employee._id);
    setForm(emptyForm);
    setOpen(true);

    const res = await dispatch(fetchEmployeeSalary(employee._id));
    if (fetchEmployeeSalary.fulfilled.match(res) && res.payload?.data) {
      const salary = res.payload.data;
      setForm(
        moneyFields.reduce((next, [key]) => {
          next[key] = salary[key] ?? "";
          return next;
        }, {})
      );
    }
  };

  const handleEmployeeChange = async (e) => {
    const nextEmployeeId = e.target.value;
    setEmployeeId(nextEmployeeId);
    setForm(emptyForm);
    if (!nextEmployeeId) return;

    const res = await dispatch(fetchEmployeeSalary(nextEmployeeId));
    if (fetchEmployeeSalary.fulfilled.match(res) && res.payload?.data) {
      const salary = res.payload.data;
      setForm(
        moneyFields.reduce((next, [key]) => {
          next[key] = salary[key] ?? "";
          return next;
        }, {})
      );
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      notify.error("Select an employee");
      return;
    }

    const payload = Object.fromEntries(
      moneyFields.map(([key]) => [key, Number(form[key] || 0)])
    );

    setBusy(true);
    const action = selected?._id
      ? updateSalary({ employeeId, payload })
      : createSalary({ employeeId, ...payload });
    const res = await dispatch(action);
    setBusy(false);

    if (createSalary.fulfilled.match(res) || updateSalary.fulfilled.match(res)) {
      notify.success(selected?._id ? "Salary updated" : "Salary created");
      setSalaryByEmployee((current) => ({
        ...current,
        [employeeId]: res.payload.data,
      }));
      setOpen(false);
    } else {
      notify.error(res.payload || "Unable to save salary");
    }
  };

  const grossSalary =
    Number(form.basicSalary || 0) +
    Number(form.hra || 0) +
    Number(form.specialAllowance || 0) +
    Number(form.bonus || 0);
  const totalDeductions =
    Number(form.pf || 0) +
    Number(form.professionalTax || 0) +
    Number(form.otherDeductions || 0);
  const netSalary = grossSalary - totalDeductions;

  const columns = [
    { key: "employee", header: "Employee", render: (row) => <EmployeeLink employee={row} /> },
    { key: "employeeId", header: "Emp ID" },
    { key: "department", header: "Department", render: (row) => row.department || "-" },
    { key: "designation", header: "Designation", render: (row) => row.designation || "-" },
    {
      key: "currentSalary",
      header: "Current Salary",
      render: (row) => {
        const salary = salaryByEmployee[row._id];
        if (salaryListLoading && salary === undefined) {
          return <span className="text-slate-500">Loading...</span>;
        }
        if (!salary) {
          return <span className="text-slate-500">Not assigned</span>;
        }
        return (
          <div>
            <p className="font-semibold text-emerald-300">{fmtMoney(salary.netSalary)}</p>
            <p className="text-xs text-slate-500">Gross {fmtMoney(salary.grossSalary)}</p>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button variant="outline" className="!px-2 !py-1" onClick={() => openEditor(row)}>
          Manage Salary
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Salary Management"
        action={
          <Button
            onClick={() => {
              dispatch(clearSelectedSalary());
              setEmployeeId("");
              setForm(emptyForm);
              setOpen(true);
            }}
          >
            + Add Salary
          </Button>
        }
      >
        <Table
          columns={columns}
          data={employees}
          loading={employeesLoading}
          emptyText="No employees found"
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={selected?._id ? "Update Salary" : "Create Salary"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={busy || salaryLoading}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Employee"
            options={employeeOptions}
            value={employeeId}
            onChange={handleEmployeeChange}
          />

          {selectedEmployee && (
            <p className="text-xs text-slate-400">
              Managing salary for {fullName(selectedEmployee)}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {moneyFields.map(([key, label]) => (
              <Input
                key={key}
                label={label}
                name={key}
                type="number"
                min="0"
                step="0.01"
                value={form[key]}
                onChange={handleChange}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm sm:grid-cols-3">
            <Summary label="Gross" value={fmtMoney(grossSalary)} />
            <Summary label="Deductions" value={fmtMoney(totalDeductions)} />
            <Summary label="Net" value={fmtMoney(netSalary)} accent />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Summary({ label, value, accent = false }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-semibold ${accent ? "text-emerald-300" : "text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}
