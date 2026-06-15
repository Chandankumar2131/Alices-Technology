import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllSubmissions,
  deleteSubmission,
  selectSubmission,
} from "../../features/submission/submissionSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import EmployeeLink from "../../components/ui/EmployeeLink";
import { fmtDate } from "../../utils/helpers";
import notify from "../../utils/toast";

export default function SubmissionsAdmin() {
  const dispatch = useDispatch();
  const { allSubmissions, loading } = useSelector(selectSubmission);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { dispatch(fetchAllSubmissions()); }, [dispatch]);

  const confirmDelete = async () => {
    setBusy(true);
    const res = await dispatch(deleteSubmission(toDelete._id));
    setBusy(false);
    if (deleteSubmission.fulfilled.match(res)) {
      notify.success("Submission deleted");
      setToDelete(null);
    } else notify.error(res.payload);
  };

  const columns = [
    { key: "recruiter", header: "Recruiter", render: (r) => <EmployeeLink employee={r.recruiter} /> },
    { key: "candidateName", header: "Candidate" },
    { key: "candidateEmail", header: "Email" },
    { key: "jobTitle", header: "Job Title" },
    { key: "portal", header: "Portal" },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "createdAt", header: "Date", render: (r) => fmtDate(r.createdAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button variant="danger" className="!px-2 !py-1" onClick={() => setToDelete(r)}>Delete</Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="All Submissions">
        <Table columns={columns} data={allSubmissions} loading={loading} emptyText="No submissions" />
      </Card>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete Submission"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Delete submission for <strong>{toDelete?.candidateName}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
