import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import FeedbackAlert from "../ui/FeedbackAlert";

// --- Reusable Spinners ---
const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);

const ButtonSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
);

const SentNotices = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTarget, setFilterTarget] = useState("all");
  const [viewItem, setViewItem] = useState(null);

// ✅ Fetch ALL pages (handles backend pagination)
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const allItems = [];
      let nextUrl = "anouncements/";

      while (nextUrl) {
        const res = await api.get(nextUrl);
        const pageData = res.data;

        // Support both direct-array and paginated (results) responses
        if (Array.isArray(pageData)) {
          allItems.push(...pageData);
          break; // direct array → no more pages
        } else {
          if (Array.isArray(pageData.results)) {
            allItems.push(...pageData.results);
          }
          nextUrl = pageData.next ? pageData.next.replace(
            "https://ryacksonfungo.alwaysdata.net/api/",
            ""
          ) : null;
        }
      }

      console.log("✅ Final Announcement List (all pages):", allItems);
      setAnnouncements(allItems);
      setFilteredAnnouncements(allItems);
    } catch (err) {
      console.error("❌ Load Error:", err);
      setError("Could not load history. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // --- Search & Filter ---
  useEffect(() => {
    let result = [...announcements];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.title?.toLowerCase().includes(term) ||
        item.message?.toLowerCase().includes(term)
      );
    }
    if (filterTarget !== "all") {
      result = result.filter(item => item.target === filterTarget);
    }
    setFilteredAnnouncements(result);
  }, [announcements, searchTerm, filterTarget]);

  // --- Actions ---
  const resendItem = async (itemId) => {
    setError("");
    setSuccess("");
    setActionLoadingId(itemId);
    try {
      await api.post(`anouncements/${itemId}/resend/`);
      setSuccess("Announcement resent successfully!");
      await fetchItems();
      setActionLoadingId(null);
    } catch (err) {
      console.error("Resend failed:", err);
      setError("Failed to resend. Try again.");
      setActionLoadingId(null);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Delete this announcement?")) return;
    setError("");
    setSuccess("");
    setActionLoadingId(itemId);
    try {
      await api.delete(`anouncements/${itemId}/`);
      setSuccess("Announcement deleted successfully!");
      await fetchItems();
      setActionLoadingId(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Could not delete. Try again.");
      setActionLoadingId(null);
    }
  };

  const PriorityBadge = ({ priority }) => {
    if (priority === "High") return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">HIGH</span>;
    if (priority === "Low") return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">LOW</span>;
    return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">NORMAL</span>;
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">📨 Sent Announcements</h1>
          <p className="text-gray-500 mt-1 text-sm">View announcements sent to parents or all users</p>
        </div>
<button onClick={fetchItems} className="milk-btn whitespace-nowrap">🔄 Refresh History</button>
      </div>

      {success && <FeedbackAlert type="success" message={success} onDismiss={() => setSuccess("")} />}
      {error && <FeedbackAlert type="error" message={error} onDismiss={() => setError("")} />}

      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Search by Title or Message</label>
            <input
              type="text"
              placeholder="Type keyword..."
              className="milk-input w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Target Audience</label>
            <select className="milk-input w-full" value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)}>
              <option value="all">All Targets</option>
              <option value="Parents">Parents Only</option>
              <option value="All Users">All Users</option>
              <option value="Teachers">Teachers Only</option>
              <option value="Staff">Staff Only</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-600">Showing <strong>{filteredAnnouncements.length}</strong> of {announcements.length} records</p>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Sent List</h2>
        {filteredAnnouncements.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No announcements found matching your filters.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left border-b">Date Sent</th>
                <th className="p-3 text-left border-b">Target Audience</th>
                <th className="p-3 text-left border-b">Title</th>
                <th className="p-3 text-left border-b">Priority</th>
                <th className="p-3 text-left border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b text-sm">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="p-3 border-b font-medium">{item.target}</td>
                  <td className="p-3 border-b">{item.title}</td>
                  <td className="p-3 border-b"><PriorityBadge priority={item.priority} /></td>
                  <td className="p-3 border-b space-x-2 text-sm">
                    <button onClick={() => setViewItem(item)} className="text-blue-600 hover:underline">View</button>
                    <button
                      onClick={() => resendItem(item.id)}
                      disabled={actionLoadingId === item.id}
                      className="text-green-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === item.id ? "Resending..." : "Resend"}
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={actionLoadingId === item.id}
                      className="text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === item.id ? <ButtonSpinner /> : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-800">{viewItem.title}</h3>
              <button onClick={() => setViewItem(null)} className="text-gray-500 hover:text-gray-800 text-xl">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Target: <strong>{viewItem.target}</strong> | Priority: <strong>{viewItem.priority}</strong>
              {viewItem.created_at && ` | ${new Date(viewItem.created_at).toLocaleString()}`}
            </p>
            <div className="border-t pt-4 whitespace-pre-line text-gray-700">
              {viewItem.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentNotices;