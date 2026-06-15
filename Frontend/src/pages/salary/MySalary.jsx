import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMySalary, selectSalary } from "../../features/salary/salarySlice";
import Card from "../../components/common/Card";
import EmptyState from "../../components/ui/EmptyState";
import { fmtMoney } from "../../utils/helpers";

export default function MySalary() {
  const dispatch = useDispatch();
  const { mySalary } = useSelector(selectSalary);

  useEffect(() => { dispatch(fetchMySalary()); }, [dispatch]);

  if (!mySalary) return <Card title="My Salary"><EmptyState message="No salary structure assigned yet" /></Card>;

  const earnings = [
    ["Basic Salary", mySalary.basicSalary],
    ["HRA", mySalary.hra],
    ["Special Allowance", mySalary.specialAllowance],
    ["Bonus", mySalary.bonus],
  ];
  const deductions = [
    ["Provident Fund", mySalary.pf],
    ["Professional Tax", mySalary.professionalTax],
    ["Other Deductions", mySalary.otherDeductions],
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Earnings">
        <div className="space-y-2 text-sm">
          {earnings.map(([l, v]) => <Row key={l} label={l} value={fmtMoney(v)} />)}
          <div className="border-t border-slate-800 pt-2">
            <Row label="Gross Salary" value={fmtMoney(mySalary.grossSalary)} bold />
          </div>
        </div>
      </Card>

      <Card title="Deductions & Net">
        <div className="space-y-2 text-sm">
          {deductions.map(([l, v]) => <Row key={l} label={l} value={fmtMoney(v)} />)}
          <div className="mt-3 rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-3">
            <Row label="Net Salary" value={fmtMoney(mySalary.netSalary)} bold accent="text-emerald-300" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, bold, accent = "text-slate-100" }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/25 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${accent}`}>{value}</span>
    </div>
  );
}
