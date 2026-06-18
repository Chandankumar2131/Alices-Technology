import { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Table from "../../components/common/Table";
import { holidayService } from "../../service/holidayService";
import { fmtDate } from "../../utils/helpers";
import notify from "../../utils/toast";

/* eslint-disable react-hooks/set-state-in-effect */

const empty = {
  name: "",
  date: "",
  description: "",
};

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const res = await holidayService.getAll();
      setHolidays(res.data);
    } catch (error) {
      notify.error(error?.response?.data?.message || "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.date) {
      notify.error("Holiday name and date are required");
      return;
    }

    setBusy(true);
    try {
      await holidayService.create(form);
      notify.success("Holiday added");
      setForm(empty);
      loadHolidays();
    } catch (error) {
      notify.error(error?.response?.data?.message || "Failed to add holiday");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (holiday) => {
    setBusy(true);
    try {
      await holidayService.remove(holiday._id);
      notify.success("Holiday deleted");
      setHolidays((current) => current.filter((item) => item._id !== holiday._id));
    } catch (error) {
      notify.error(error?.response?.data?.message || "Failed to delete holiday");
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "date", header: "Date", render: (row) => fmtDate(row.date) },
    { key: "name", header: "Holiday" },
    { key: "description", header: "Description", render: (row) => row.description || "-" },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button
          variant="danger"
          className="!px-2 !py-1"
          disabled={busy}
          onClick={() => handleDelete(row)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="Add Holiday">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Holiday Name" name="name" value={form.name} onChange={handleChange} />
            <Input label="Date" type="date" name="date" value={form.date} onChange={handleChange} />
          </div>
          <Input
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional"
          />
          <Button type="submit" loading={busy}>
            Add Holiday
          </Button>
        </form>
      </Card>

      <Card title="Company Holidays">
        <Table columns={columns} data={holidays} loading={loading} emptyText="No holidays added" />
      </Card>
    </div>
  );
}
