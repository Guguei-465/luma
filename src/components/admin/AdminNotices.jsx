import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState("all"); // matches real backend choices: Low / Normal / High
  const [filterTarget, setFilterTarget] = useState("all");
  const [search, setSearch] = useState("");

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("anouncements/");
      setNotices(getArray(data));
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter((n) => {
    if (filterPriority !== "all" && n.priority !== filterPriority) return false;
    if (filterTarget !== "all" && n.target !== filterTarget) return false;
    if (search) {
      const term = search.toLowerCase();
      const inTitle = (n.title || "").toLowerCase().includes(term);
      const inMessage = (n.message || "").toLowerCase().includes(term);
      if (!inTitle && !inMessage) return false;
    }
    return true;
  });

  const handleResend = async (id, title) => {
    if (!window.confirm(`Resend "${title}" to all its recipients again?`)) return;
    try {
      const { data } = await api.post(`anouncements/${id}/resend/`);
      toast.success(data.detail || "Resent successfully");
    } catch {
      toast.error("Failed to resend notice");
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`anouncements/${id}/`);
      toast.success("Notice deleted");
      fetchNotices();
    } catch {
      toast.error("Failed to delete notice");
    }
  };

  const PriorityBadge = ({ priority }) => {
    const styles = {
      High: "bg-red-100 text-red-700 border border-red-200",
      Normal: "bg-blue-100 text-blue-700 border border-blue-200",
      Low: "bg-gray-100 text-gray-700 border border-gray-200",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[priority] || styles.Normal}`}>
        {priority} Priority
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-KE", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Notices & Announcements</h2>
        <p className="text-gray-500 text-sm">View, resend or remove official school-wide notices</p>
      </div>

      <AdminSubNav items={noticeTabs} title="Notices" />

      {/* Filters */}
      <div className="card p-4 mb-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="form-label">Search</label>
          <input
            type="text"
            className="milk-input"
            placeholder="Title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Priority</label>
          <select className="milk-input" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="High">High Priority / Urgent</option>
            <option value="Normal">Normal Priority</option>
            <option value="Low">General / Low Priority</option>
          </select>
        </div>
        <div>
          <label className="form-label">Audience</label>
          <select className="milk-input" value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)}>
            <option value="all">All Audiences</option>
            <option value="All Users">All Users</option>
            <option value="Staff">Staff</option>
            <option value="Teachers">Teachers</option>
            <option value="Parents">Parents</option>
          </select>
        </div>
        <div className="flex items-end">
          <Link to="/admin-dashboard/notices/send" className="milk-btn w-full text-center">
            + New Notice
          </Link>
        </div>
      </div>

      {/* Loading / Empty State */}
      {loading && <p className="p-4 text-gray-500">Loading notices...</p>}
      {!loading && filteredNotices.length === 0 && (
        <div className="card p-6 text-center text-gray-500">
          <p className="text-lg">No notices found</p>
          <p className="text-sm mt-1">
            {notices.length === 0 ? "No announcements have been sent yet" : "No notices match your filters"}
          </p>
        </div>
      )}

      {/* Notices List */}
      {!loading && filteredNotices.length > 0 && (
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`card p-5 border-l-4 ${
                notice.priority === "High" ? "border-red-500" :
                notice.priority === "Normal" ? "border-blue-500" : "border-gray-400"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{notice.title}</h3>
                <div className="flex gap-2 flex-wrap">
                  <PriorityBadge priority={notice.priority} />
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    {notice.recipient_name ? `To: ${notice.recipient_name}` : notice.target}
                  </span>
                  {!notice.is_active && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600">Inactive</span>
                  )}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-3">{notice.message}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500 mb-3">
                <span>📅 Published: {formatDate(notice.created_at)}</span>
                {notice.created_by_name && <span className="sm:ml-auto">👤 By: {notice.created_by_name}</span>}
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={() => handleResend(notice.id, notice.title)} className="bg-blue-500 text-white px-3 py-1 rounded">
                  Resend
                </button>
                <button onClick={() => handleDelete(notice.id, notice.title)} className="bg-red-500 text-white px-3 py-1 rounded">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotices;
