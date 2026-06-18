import { useState } from "react";
import { authService } from "../../service/authService";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { getApiError } from "../../utils/apiError";
import notify from "../../utils/toast";

const empty = { firstName: "", lastName: "", email: "", password: "", department: "", designation: "" };

export default function CreateAdmin() {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      notify.error("First name, last name, email and password are required");
      return;
    }
    setBusy(true);
    try {
      await authService.createAdmin(form);
      notify.success("Admin created successfully");
      setForm(empty);
    } catch (err) {
      notify.error(getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Create Admin">
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
          <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
        </div>
        <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Department" name="department" value={form.department} onChange={handleChange} />
          <Input label="Designation" name="designation" value={form.designation} onChange={handleChange} />
        </div>
        <Button type="submit" loading={busy}>Create Admin</Button>
      </form>
    </Card>
  );
}
