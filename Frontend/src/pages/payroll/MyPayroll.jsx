import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyPayroll, selectPayroll } from "../../features/payroll/payrollSlice";
import { payrollService } from "../../service/payrollService";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { fmtMoney, monthName } from "../../utils/helpers";
import notify from "../../utils/toast";

export default function MyPayroll() {
  const dispatch = useDispatch();
  const { myPayroll, loading } = useSelector(selectPayroll);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => { dispatch(fetchMyPayroll()); }, [dispatch]);

  const handleDownload = async (p) => {
    setDownloadingId(p._id);
    try {
      await payrollService.downloadPayslip(p._id, p.month, p.year);
      notify.success("Payslip downloaded");
    } catch {
      notify.error("Failed to download payslip");
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    { key: "period", header: "Period", render: (r) => `${monthName(r.month)} ${r.year}` },
    { key: "workingDays", header: "Working Days" },
    { key: "presentDays", header: "Present" },
    { key: "halfDays", header: "Half Day", render: (r) => r.halfDays || 0 },
    { key: "leaveDays", header: "Leave" },
    { key: "holidayDays", header: "Holiday", render: (r) => r.holidayDays || 0 },
    { key: "absentDays", header: "Absent" },
    { key: "netSalary", header: "Net Salary", render: (r) => fmtMoney(r.netSalary) },
    { key: "paymentStatus", header: "Status", render: (r) => <Badge status={r.paymentStatus} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button
          variant="outline"
          className="!px-2 !py-1"
          loading={downloadingId === r._id}
          onClick={() => handleDownload(r)}
        >
          ⬇ Payslip
        </Button>
      ),
    },
  ];

  return (
    <Card title="My Payroll">
      <Table columns={columns} data={myPayroll} loading={loading} emptyText="No payroll records yet" />
    </Card>
  );
}
