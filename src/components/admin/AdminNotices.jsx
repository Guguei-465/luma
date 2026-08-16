import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/api";

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState("all"); // all / high / normal / low

  // Fetch notices from Django backend
  const fetchNotices = async () => {
    try {
const { data } = await api.get("anouncements/"); // your Notice API endpoint
      setNotices(data);
    } catch (err) {
      toast.error("❌ Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Filter by priority
  const filteredNotices = notices.filter(n => 
    filterPriority === "all" || n.priority === filterPriority
  );

  // Priority badge styling
  const PriorityBadge = ({ priority }) => {
    const styles = {
      high: "bg-red-100 text-red-700 border border-red-200",
      normal: "bg-blue-100 text-blue-700 border border-blue-200",
      low: "bg-gray-100 text-gray-700 border border-gray-200"
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${styles[priority] || styles.normal}`}>
        {priority} Priority
      </span>
    );
  };

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-KE", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Admin Notices & Announcements</h2>
        <p className="text-gray-500 text-sm">View important updates, alerts and official information</p>
      </div>

      {/* Priority Filter */}
      <div className="card p-4 mb-5">
        <label className="form-label mb-2">Filter by Priority:</label>
        <select
          className="milk-input max-w-xs"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="all">All Notices</option>
          <option value="high">High Priority / Urgent</option>
          <option value="normal">Normal Priority</option>
          <option value="low">General / Low Priority</option>
        </select>
      </div>

      {/* Loading / Empty State */}
      {loading && <p className="p-4 text-gray-500">Loading notices...</p>}
      {!loading && filteredNotices.length === 0 && (
        <div className="card p-6 text-center text-gray-500">
          <p className="text-lg">No notices available</p>
          <p className="text-sm mt-1">No new announcements or alerts at this time</p>
        </div>
      )}

      {/* Notices List — Sorted Newest First */}
      {!loading && filteredNotices.length > 0 && (
        <div className="space-y-4">
          {filteredNotices.map(notice => (
            <div 
              key={notice.id} 
              className={`card p-5 border-l-4 ${
                notice.priority === "high" ? "border-red-500" :
                notice.priority === "normal" ? "border-blue-500" : "border-gray-400"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{notice.title}</h3>
                <PriorityBadge priority={notice.priority} />
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-3">
                {notice.message}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500">
                <span>📅 Published: {formatDate(notice.created_at)}</span>
                {notice.created_by && <span className="sm:ml-auto">👤 By: {notice.created_by}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotices;