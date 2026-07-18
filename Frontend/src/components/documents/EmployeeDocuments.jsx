import { useCallback, useEffect, useState } from "react";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";
import Input from "../common/Input";
import Modal from "../common/Modal";
import Select from "../common/Select";
import Table from "../common/Table";
import { employeeDocumentService } from "../../service/employeeDocumentService";
import { fmtDate, fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

const DOCUMENT_TYPES = ["Aadhaar Card", "PAN Card", "Passport", "Photo", "10th Certificate", "12th Certificate", "Graduation Degree", "PG Degree"];
const REVIEW_STATUSES = ["Verified", "Rejected", "Replacement Requested"];
const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong";

const readDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
});

export default function EmployeeDocuments({ admin = false, employeeId = "" }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState({ documentType: "Aadhaar Card", documentNumber: "", file: null });
  const [reviewing, setReviewing] = useState(null);
  const [review, setReview] = useState({ status: "Verified", adminRemarks: "" });
  const uploadedTypes = new Set(documents.map((document) => document.documentType));
  const availableDocumentTypes = DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type));
  const selectedDocumentType = availableDocumentTypes.includes(form.documentType) ? form.documentType : (availableDocumentTypes[0] || "");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = admin ? await employeeDocumentService.getForEmployee(employeeId) : await employeeDocumentService.getMine();
      setDocuments(response.data || []);
    } catch (error) { notify.error(errorText(error)); }
    finally { setLoading(false); }
  }, [admin, employeeId]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const validateFile = (file) => {
    if (!file || !["application/pdf", "image/jpeg", "image/png"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      notify.error("Choose a PDF, JPG or PNG file up to 8 MB"); return false;
    }
    return true;
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!validateFile(form.file)) return;
    setBusy("upload");
    try {
      await employeeDocumentService.upload({ documentType: selectedDocumentType, documentNumber: form.documentNumber, dataUrl: await readDataUrl(form.file), fileName: form.file.name, mimeType: form.file.type, size: form.file.size });
      notify.success("Document uploaded for review"); setForm({ documentType: "", documentNumber: "", file: null }); await load();
    } catch (error) { notify.error(errorText(error)); }
    finally { setBusy(""); }
  };

  const replace = async (document, file) => {
    if (!validateFile(file)) return;
    setBusy(document._id);
    try {
      await employeeDocumentService.upload({ documentId: document._id, documentType: document.documentType, dataUrl: await readDataUrl(file), fileName: file.name, mimeType: file.type, size: file.size });
      notify.success("Replacement uploaded for review"); await load();
    } catch (error) { notify.error(errorText(error)); }
    finally { setBusy(""); }
  };

  const remove = async (document) => {
    if (!window.confirm(`Delete ${document.documentType}?`)) return;
    setBusy(document._id);
    try { await employeeDocumentService.remove(document._id); notify.success("Document deleted"); await load(); }
    catch (error) { notify.error(errorText(error)); }
    finally { setBusy(""); }
  };

  const submitReview = async () => {
    setBusy("review");
    try { await employeeDocumentService.review(reviewing._id, review); notify.success("Document review updated"); setReviewing(null); await load(); }
    catch (error) { notify.error(errorText(error)); }
    finally { setBusy(""); }
  };

  const columns = [
    { key: "documentType", header: "Document" },
    { key: "fileName", header: "File", render: (row) => <button type="button" className="font-semibold text-cyan-500 hover:underline" onClick={() => window.open(employeeDocumentService.accessUrl(row._id), "_blank", "noopener,noreferrer")}>{row.fileName}</button> },
    { key: "number", header: "Number", render: (row) => row.maskedDocumentNumber || "—" },
    { key: "updatedAt", header: "Uploaded", render: (row) => fmtDate(row.updatedAt) },
    { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
    { key: "remarks", header: "Remarks", render: (row) => row.adminRemarks || "—" },
    { key: "actions", header: "Actions", render: (row) => admin ? <Button variant="outline" className="min-h-8 px-3 py-1 text-xs" onClick={() => { setReviewing(row); setReview({ status: row.status === "Pending Review" ? "Verified" : row.status, adminRemarks: row.adminRemarks || "" }); }}>Review</Button> : <div className="flex flex-wrap gap-2"><input id={`replace-document-${row._id}`} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(event) => replace(row, event.target.files?.[0])} /><Button variant="outline" loading={busy === row._id} disabled={row.status === "Verified"} className="min-h-8 px-3 py-1 text-xs" onClick={() => document.getElementById(`replace-document-${row._id}`)?.click()}>Replace</Button><Button variant="danger" disabled={row.status === "Verified"} className="min-h-8 px-3 py-1 text-xs" onClick={() => remove(row)}>Delete</Button></div> },
  ];

  return <div className="space-y-5">
    {!admin && <Card title="Upload Employee Document">{availableDocumentTypes.length ? <form onSubmit={upload} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-end"><Select label="Document Type" options={availableDocumentTypes} value={selectedDocumentType} onChange={(event) => setForm({ ...form, documentType: event.target.value })} /><Input label="Document Number (optional)" value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value })} placeholder="Stored securely; displayed masked" /><Input label="PDF, JPG or PNG (max 8 MB)" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} /><Button type="submit" loading={busy === "upload"}>Upload</Button></form> : <p className="text-sm text-slate-400">All document types have been uploaded. Use Replace below to update an existing document.</p>}</Card>}
    <Card title={admin ? "Employee Documents" : "My Documents"}><Table columns={columns} data={documents} loading={loading} emptyText="No documents uploaded" /></Card>
    <Modal open={!!reviewing} onClose={() => setReviewing(null)} title={`Review ${reviewing?.documentType || "Document"}`} footer={<><Button variant="secondary" onClick={() => setReviewing(null)}>Cancel</Button><Button onClick={submitReview} loading={busy === "review"}>Save Review</Button></>}><div className="space-y-4"><button type="button" onClick={() => window.open(employeeDocumentService.accessUrl(reviewing?._id), "_blank", "noopener,noreferrer")} className="font-semibold text-cyan-500 hover:underline">Open {reviewing?.fileName}</button><Select label="Review Status" options={REVIEW_STATUSES} value={review.status} onChange={(event) => setReview({ ...review, status: event.target.value })} /><div><label htmlFor="document-review-remarks" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Admin Remarks</label><textarea id="document-review-remarks" rows={4} value={review.adminRemarks} onChange={(event) => setReview({ ...review, adminRemarks: event.target.value })} className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none" /></div>{reviewing?.reviewedBy && <p className="text-xs text-slate-400">Last reviewed by {fullName(reviewing.reviewedBy)} on {fmtDate(reviewing.reviewedAt)}</p>}</div></Modal>
  </div>;
}
