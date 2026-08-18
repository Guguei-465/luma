import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const noticeTabs = [
  { to: "/admin-dashboard/notices", end: true, icon: "bi bi-megaphone-fill", label: "All Notices" },
  { to: "/admin-dashboard/notices/send", icon: "bi bi-send-fill", label: "Send Notice" },
];

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const SendNotices = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "Normal",
    target: "All Users",
    recipient: "", // optional — a single specific user instead of a whole audience
  });

  const [sendMode, setSendMode] = useState("audience"); // "audience" | "specific"
  const [submitting, setSubmitting] = useState(false);

  // Only fetched if the admin switches to "specific user" mode.
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (sendMode !== "specific" || users.length > 0) return;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const { data } = await api.get("accounts/users/");
        setUsers(getArray(data));
      } catch {
        toast.error("Failed to load users list");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [sendMode, users.length]);

  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    const name = `${u.first_name || ""} ${u.last_name || ""} ${u.username || ""}`.toLowerCase();
    return name.includes(term);
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (sendMode === "specific" && !form.recipient) {
      toast.warn("Select a recipient, or switch to Audience mode");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        message: form.message,
        priority: form.priority,
        target: form.target,
        recipient: sendMode === "specific" ? form.recipient : null,
      };

      await api.post("anouncements/", payload);
      toast.success("Notice sent successfully!");
      navigate("/admin-dashboard/notices");
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to send notice";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Send Notice</h2>
        <p className="text-gray-500 mt-1">Broadcast an announcement to the whole school or one person</p>
      </div>

      <AdminSubNav items={noticeTabs} title="Notices" />

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="form-label">Title *</label>
          <input
            type="text"
            name="title"
            className="milk-input"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Mid-Term Exam Schedule Released"
            required
          />
        </div>

        <div>
          <label className="form-label">Message *</label>
          <textarea
            name="message"
            className="milk-input resize-none"
            rows={5}
            value={form.message}
            onChange={handleChange}
            placeholder="Write the full announcement..."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Priority</label>
            <select name="priority" className="milk-input" value={form.priority} onChange={handleChange}>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High / Urgent</option>
            </select>
          </div>

          <div>
            <label className="form-label">Send To</label>
            <select
              className="milk-input"
              value={sendMode}
              onChange={(e) => {
                setSendMode(e.target.value);
                setForm((prev) => ({ ...prev, recipient: "" }));
              }}
            >
              <option value="audience">A whole audience</option>
              <option value="specific">One specific person</option>
            </select>
          </div>
        </div>

        {sendMode === "audience" ? (
          <div>
            <label className="form-label">Audience *</label>
            <select name="target" className="milk-input" value={form.target} onChange={handleChange} required>
              <option value="All Users">All Users</option>
              <option value="Staff">Staff (Admin, Coordinator, Accountant &amp; Teachers)</option>
              <option value="Teachers">Teachers Only</option>
              <option value="Parents">Parents Only</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="form-label">Recipient *</label>
            <input
              type="text"
              className="milk-input mb-2"
              placeholder="Search by name or username..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <select
              name="recipient"
              className="milk-input"
              value={form.recipient}
              onChange={handleChange}
              disabled={loadingUsers}
              required
            >
              <option value="">
                {loadingUsers ? "Loading users..." : "Select a person"}
              </option>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.role}) — {u.username}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" disabled={submitting} className="milk-btn w-full">
          {submitting ? "Sending..." : "Send Notice"}
        </button>
      </form>
    </div>
  );
};

export default SendNotices;
