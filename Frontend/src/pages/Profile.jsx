import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  fetchProfile,
  updateProfile,
  updateProfileDetails,
  changePassword,
} from "../features/auth/authSlice";
import useAuth from "../hooks/useAuth";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import { GENDERS, BLOOD_GROUPS, MARITAL_STATUS } from "../constants/enums";
import notify from "../utils/toast";

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

  return (
    <div className="space-y-6">
      <Card title="Basic Information">
        <form onSubmit={saveBasics} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="First Name" value={basics.firstName} onChange={(e) => setBasics({ ...basics, firstName: e.target.value })} />
            <Input label="Last Name" value={basics.lastName} onChange={(e) => setBasics({ ...basics, lastName: e.target.value })} />
            <Input label="Department" value={basics.department} onChange={(e) => setBasics({ ...basics, department: e.target.value })} />
            <Input label="Designation" value={basics.designation} onChange={(e) => setBasics({ ...basics, designation: e.target.value })} />
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

      <Card title="Change Password">
        <form onSubmit={savePassword} className="max-w-md space-y-4">
          <Input label="Current Password" type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          <Input label="New Password" type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          <Button type="submit" loading={busy === "pwd"}>Change Password</Button>
        </form>
      </Card>
    </div>
  );
}
