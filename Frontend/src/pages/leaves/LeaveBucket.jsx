import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "../../components/common/Card";
import Spinner from "../../components/common/Spinner";
import { fetchMyLeaveBucket, selectLeave } from "../../features/leave/leaveSlice";
import { fmtDate } from "../../utils/helpers";

const bucketCards = [
  { key: "casualAvailable", label: "Casual Leave", note: "Eligible after 6 months" },
  { key: "sickAvailable", label: "Sick Leave", note: "1 paid leave per month after 3 months" },
  { key: "carryForwardAvailable", label: "Carry Forward", note: "Use within 90 days" },
  { key: "unpaidLeaveDays", label: "Unpaid Extra Leave", note: "Deducted during payroll" },
];

export default function LeaveBucket() {
  const dispatch = useDispatch();
  const { myBucket, loading } = useSelector(selectLeave);

  useEffect(() => {
    dispatch(fetchMyLeaveBucket());
  }, [dispatch]);

  if (loading && !myBucket) return <Spinner full />;

  const eligibility = myBucket?.eligibility || {};

  return (
    <div className="space-y-6">
      <Card title="Leave Bucket">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {bucketCards.map((item) => (
            <div key={item.key} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-50">{myBucket?.[item.key] ?? 0}</p>
              <p className="mt-2 text-xs text-slate-500">{item.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Eligibility">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="text-sm text-slate-400">Service From</p>
            <p className="mt-2 text-xl font-semibold">{eligibility.serviceStartDate ? fmtDate(eligibility.serviceStartDate) : "-"}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="text-sm text-slate-400">Service Completed</p>
            <p className="mt-2 text-xl font-semibold">{eligibility.serviceMonthsCompleted ?? 0} months</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="text-sm text-slate-400">Sick Leave</p>
            <p className="mt-2 text-xl font-semibold">{eligibility.sickLeaveEligible ? "Eligible" : "Not eligible"}</p>
            {eligibility.sickEligibleFrom && (
              <p className="mt-2 text-xs text-slate-500">From {fmtDate(eligibility.sickEligibleFrom)}</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="text-sm text-slate-400">Casual Leave</p>
            <p className="mt-2 text-xl font-semibold">{eligibility.casualLeaveEligible ? "Eligible" : "Not eligible"}</p>
            {eligibility.casualEligibleFrom && (
              <p className="mt-2 text-xs text-slate-500">From {fmtDate(eligibility.casualEligibleFrom)}</p>
            )}
          </div>
        </div>
        {myBucket?.carryForwardExpiresAt && (
          <p className="mt-4 text-sm text-slate-400">
            Carry forward balance expires on {fmtDate(myBucket.carryForwardExpiresAt)}.
          </p>
        )}
      </Card>
    </div>
  );
}
