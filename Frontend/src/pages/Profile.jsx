import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  fetchProfile,
  updateProfile,
  updateProfileDetails,
  updateProfilePicture,
  changePassword,
  submitResignation,
  withdrawResignation,
} from "../features/auth/authSlice";
import useAuth from "../hooks/useAuth";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Modal from "../components/common/Modal";
import { GENDERS, BLOOD_GROUPS, MARITAL_STATUS } from "../constants/enums";
import notify from "../utils/toast";
import EmployeeDocuments from "../components/documents/EmployeeDocuments";

const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PROFILE_IMAGE_MAX_BYTES = 3 * 1024 * 1024;

const readImageAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });

/* eslint-disable react-hooks/set-state-in-effect */

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [basics, setBasics] = useState({ firstName: "", lastName: "", department: "", designation: "" });
  const [details, setDetails] = useState({
    gender: "", dateOfBirth: "", contactNumber: "", address: "", city: "", state: "",
    country: "", pincode: "", bloodGroup: "", maritalStatus: "",
    emergencyContactName: "", emergencyContactNumber: "",
  });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [resignationReason, setResignationReason] = useState("");
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => { dispatch(fetchProfile()); }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    setBasics({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      department: user.department || "",
      designation: user.designation || "",
    });
    const p = user.additionalDetails || {};
    setDetails((d) => ({
      ...d,
      gender: p.gender || "",
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
      contactNumber: p.contactNumber || "",
      address: p.address || "",
      city: p.city || "",
      state: p.state || "",
      country: p.country || "",
      pincode: p.pincode || "",
      bloodGroup: p.bloodGroup || "",
      maritalStatus: p.maritalStatus || "",
      emergencyContactName: p.emergencyContactName || "",
      emergencyContactNumber: p.emergencyContactNumber || "",
    }));
  }, [user]);

  const saveBasics = async (e) => {
    e.preventDefault();
    setBusy("basics");
    const res = await dispatch(updateProfile(basics));
    setBusy("");
    if (updateProfile.fulfilled.match(res)) notify.success("Profile updated");
    else notify.error(res.payload);
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    setBusy("details");
    const res = await dispatch(updateProfileDetails(details));
    setBusy("");
    if (updateProfileDetails.fulfilled.match(res)) { notify.success("Details updated"); dispatch(fetchProfile()); }
    else notify.error(res.payload);
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pwd.currentPassword || !pwd.newPassword) { notify.error("Both passwords are required"); return; }
    setBusy("pwd");
    const res = await dispatch(changePassword(pwd));
    setBusy("");
    if (changePassword.fulfilled.match(res)) { notify.success("Password changed"); setPwd({ currentPassword: "", newPassword: "" }); }
    else notify.error(res.payload);
  };

  const submitResign = async (e) => {
    e.preventDefault();
    if (!resignationReason.trim()) {
      notify.error("Resignation reason is required");
      return;
    }
    setBusy("resign");
    const res = await dispatch(submitResignation({ reason: resignationReason }));
    setBusy("");
    if (submitResignation.fulfilled.match(res)) {
      notify.success("Resignation submitted");
      setResignationReason("");
    } else notify.error(res.payload);
  };

  const resignation = user?.resignation;
  const fmtDate = (value) => value ? new Date(value).toLocaleDateString("en-IN") : "-";

  const submitWithdrawal = async () => {
    if (!withdrawalReason.trim()) {
      notify.error("Withdrawal reason is required");
      return;
    }
    setBusy("withdraw");
    const res = await dispatch(withdrawResignation({ reason: withdrawalReason }));
    setBusy("");
    if (withdrawResignation.fulfilled.match(res)) {
      notify.success(resignation?.status === "Submitted"
        ? "Resignation withdrawn"
        : "Withdrawal request sent for approval");
      setWithdrawalOpen(false);
      setWithdrawalReason("");
    } else notify.error(res.payload);
  };

  const uploadProfilePicture = async (file) => {
    if (!file) return;
    if (!PROFILE_IMAGE_TYPES.has(file.type) || file.size > PROFILE_IMAGE_MAX_BYTES) {
      notify.error("Upload a JPG, PNG, or WebP image up to 3 MB");
      return;
    }

    try {
      setBusy("picture");
      const dataUrl = await readImageAsDataUrl(file);
      const res = await dispatch(updateProfilePicture({
        dataUrl,
        mimeType: file.type,
        size: file.size,
      }));
      if (updateProfilePicture.fulfilled.match(res)) notify.success("Profile picture updated");
      else notify.error(res.payload);
    } catch {
      notify.error("Unable to upload profile picture");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            {user?.image ? (
              <img
                src={user.image}
                alt={`${user.firstName || "User"} profile`}
                width="104"
                height="104"
                className="h-24 w-24 rounded-2xl border border-cyan-300/25 object-cover shadow-xl shadow-black/20 ring-4 ring-cyan-300/[0.06] sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-3xl font-bold text-cyan-200 sm:h-28 sm:w-28">
                {(user?.firstName || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-slate-900 bg-emerald-400 text-xs text-slate-950">✓</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">Profile picture</p>
            <h1 className="mt-1 truncate text-xl font-bold text-slate-50">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {user?.designation || user?.accountType}{user?.department ? ` · ${user.department}` : ""}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Use a clear square photo. It will appear in your sidebar, employee profile, and team conversations.
            </p>
          </div>
          <div className="shrink-0">
            <input
              id="profile-picture-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                uploadProfilePicture(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              loading={busy === "picture"}
              disabled={Boolean(busy && busy !== "picture")}
              onClick={() => document.getElementById("profile-picture-upload")?.click()}
            >
              Change Photo
            </Button>
            <p className="mt-2 text-center text-xs text-slate-500">JPG, PNG or WebP · Max 3 MB</p>
          </div>
        </div>
      </Card>

      <Card title="Basic Information">
        <form onSubmit={saveBasics} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="First Name" value={basics.firstName} onChange={(e) => setBasics({ ...basics, firstName: e.target.value })} />
            <Input label="Last Name" value={basics.lastName} onChange={(e) => setBasics({ ...basics, lastName: e.target.value })} />
            <Input label="Department" value={basics.department} disabled />
            <Input label="Designation" value={basics.designation} disabled />
          </div>
          <Button type="submit" loading={busy === "basics"}>Save Basics</Button>
        </form>
      </Card>

      <Card title="Personal Details">
        <form onSubmit={saveDetails} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select label="Gender" options={["", ...GENDERS]} value={details.gender} onChange={(e) => setDetails({ ...details, gender: e.target.value })} />
            <Input label="Date of Birth" type="date" value={details.dateOfBirth} onChange={(e) => setDetails({ ...details, dateOfBirth: e.target.value })} />
            <Input label="Contact Number" value={details.contactNumber} onChange={(e) => setDetails({ ...details, contactNumber: e.target.value })} />
            <Input label="Address" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} />
            <Input label="City" value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} />
            <Input label="State" value={details.state} onChange={(e) => setDetails({ ...details, state: e.target.value })} />
            <Input label="Country" value={details.country} onChange={(e) => setDetails({ ...details, country: e.target.value })} />
            <Input label="Pincode" value={details.pincode} onChange={(e) => setDetails({ ...details, pincode: e.target.value })} />
            <Select label="Blood Group" options={["", ...BLOOD_GROUPS]} value={details.bloodGroup} onChange={(e) => setDetails({ ...details, bloodGroup: e.target.value })} />
            <Select label="Marital Status" options={["", ...MARITAL_STATUS]} value={details.maritalStatus} onChange={(e) => setDetails({ ...details, maritalStatus: e.target.value })} />
            <Input label="Emergency Contact Name" value={details.emergencyContactName} onChange={(e) => setDetails({ ...details, emergencyContactName: e.target.value })} />
            <Input label="Emergency Contact Number" value={details.emergencyContactNumber} onChange={(e) => setDetails({ ...details, emergencyContactNumber: e.target.value })} />
          </div>
          <Button type="submit" loading={busy === "details"}>Save Details</Button>
        </form>
      </Card>

      {user?.accountType === "Employee" && <EmployeeDocuments />}

      <Card title="Change Password">
        <form onSubmit={savePassword} className="max-w-md space-y-4">
          <Input label="Current Password" type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          <Input label="New Password" type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          <Button type="submit" loading={busy === "pwd"}>Change Password</Button>
        </form>
      </Card>

      {user?.accountType === "Employee" && <Card title="Resignation">
        {resignation?.status && resignation.status !== "None" ? (
          <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Status</p>
              <p className="mt-2 font-semibold">{resignation.status}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Resignation Date</p>
              <p className="mt-2 font-semibold">{fmtDate(resignation.resignationDate)}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Last Working Day</p>
              <p className="mt-2 font-semibold">{fmtDate(resignation.lastWorkingDay)}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Knowledge Transfer</p>
              <p className="mt-2 font-semibold">{resignation.knowledgeTransferCompleted ? "Completed" : "Pending"}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Company Assets</p>
              <p className="mt-2 font-semibold">{resignation.assetsReturned ? "Returned" : "Pending"}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Handover</p>
              <p className="mt-2 font-semibold">
                {resignation.knowledgeTransferCompleted && resignation.assetsReturned ? "Completed" : "Pending"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4"><p className="text-sm text-slate-400">Reason</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{resignation.reason || "—"}</p></div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4"><p className="text-sm text-slate-400">Admin Remarks</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{resignation.adminRemarks || "No remarks provided"}</p></div>
          </div>
          {["Submitted", "Approved"].includes(resignation.status) && (
            <div className="border-t border-slate-700 pt-4">
              <Button
                variant="primary"
                className="ring-2 ring-cyan-300/35 shadow-lg shadow-cyan-400/20"
                onClick={() => {
                  setWithdrawalReason("");
                  setWithdrawalOpen(true);
                }}
              >
                Withdraw Resignation
              </Button>
              <p className="mt-2 text-xs text-slate-500">
                {resignation.status === "Approved"
                  ? "An approved resignation requires Admin approval before it can be withdrawn."
                  : "A resignation awaiting review can be withdrawn immediately."}
              </p>
            </div>
          )}
          {resignation.withdrawalReason && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Withdrawal Reason</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{resignation.withdrawalReason}</p>
              {resignation.withdrawalAdminRemarks && (
                <p className="mt-2 text-xs text-slate-400">Admin: {resignation.withdrawalAdminRemarks}</p>
              )}
            </div>
          )}
          </div>
        ) : (
          <form onSubmit={submitResign} className="max-w-2xl space-y-4">
            <div>
              <label htmlFor="resignation-reason" className="mb-1 block text-sm font-medium text-slate-300">Reason</label>
              <textarea
                id="resignation-reason"
                value={resignationReason}
                onChange={(e) => setResignationReason(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40"
              />
            </div>
            <p className="text-sm text-slate-400">
              Notice period is 1 month. Knowledge transfer and company asset handover are expected before the last working day.
            </p>
            <Button type="submit" loading={busy === "resign"}>Submit Resignation</Button>
          </form>
        )}
      </Card>}

      <Modal
        open={withdrawalOpen}
        onClose={() => setWithdrawalOpen(false)}
        title="Withdraw Resignation"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setWithdrawalOpen(false)}>Cancel</Button>
            <Button loading={busy === "withdraw"} onClick={submitWithdrawal}>
              Submit Withdrawal
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="text-sm leading-6 text-slate-400">
            Explain why you want to continue your employment. This request and its decision will remain in your HR record.
          </p>
          <label htmlFor="withdrawal-reason" className="mb-1 block text-sm font-medium text-slate-300">Reason</label>
          <textarea
            id="withdrawal-reason"
            rows={4}
            maxLength={2000}
            value={withdrawalReason}
            onChange={(event) => setWithdrawalReason(event.target.value)}
            className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
          />
        </div>
      </Modal>
    </div>
  );
}
