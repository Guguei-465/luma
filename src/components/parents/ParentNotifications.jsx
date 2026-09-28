import { useEffect, useState, useCallback } from "react";
import api from "../api/api";


const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-green-600"></div>
  </div>
);


const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.notifiations)) return data.notifiations;
  if (Array.isArray(data?.anouncements)) return data.anouncements;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};


const safeString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};


const formatDateTime = (value) => {
  if (!value) return "Date unavailable";
  try {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  } catch { return String(value); }
};


const ParentNotifications = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [myNotifications, setMyNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");


  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [annRes, notifRes, countRes] = await Promise.all([
        api.get("anouncements/"),
        api.get("notifiations/my/"),
        api.get("notifiations/my/unread-count/"),
      ]);

      const annList = getArray(annRes.data);
      const notifList = getArray(notifRes.data);
      const count = countRes.data?.unread_count ?? countRes.data?.count ?? 0;

      setAnnouncements(annList);
      setMyNotifications(notifList);
      setUnreadCount(count);

    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load updates.");
    } finally {
      setLoading(false);
    }
  }, []);


  const markAsRead = useCallback(async (notificationId) => {
    try {
      setMarkingId(notificationId);
      await api.patch(`notifiations/my/${notificationId}/read/`);
      setMyNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      // Silently fail or handle gracefully
    } finally {
      setMarkingId(null);
    }
  }, []);


  const markAllAsRead = useCallback(async () => {
    try {
      setMarkingAll(true);
      await api.patch("notifiations/my/read-all/");
      setMyNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // Silently fail or handle gracefully
    } finally {
      setMarkingAll(false);
    }
  }, []);


  useEffect(() => {
    fetchAll();
  }, [fetchAll]);


  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchAll}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Updates & Notifications</h3>
          <p className="text-sm text-gray-500 mt-1">School announcements and personal alerts.</p>
        </div>
        <button
          onClick={fetchAll}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* PERSONAL NOTIFICATIONS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            🔔 My Notifications
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount} new
              </span>
            )}
          </h4>
          {myNotifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {markingAll ? "Marking..." : "✓ Mark All Read"}
            </button>
          )}
        </div>

        {myNotifications.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myNotifications.map((item, i) => {
              const isRead = item.is_read;
              return (
                <div
                  key={item.id || `notif-${i}`}
                  className={`rounded-xl shadow-sm border p-4 transition-opacity ${
                    isRead
                      ? "bg-gray-50 border-gray-200 opacity-75"
                      : "bg-white border-l-4 border-l-orange-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h5 className={`font-semibold ${isRead ? "text-gray-600" : "text-gray-800"}`}>
                        {!isRead && <span className="text-orange-500 mr-1">●</span>}
                        {item.title || "Notification"}
                      </h5>
                      <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">
                        {item.message || item.content || "No content."}
                      </p>
                      {item.created_at && (
                        <small className="text-gray-400 mt-3 block">
                          Posted {formatDateTime(item.created_at)}
                        </small>
                      )}
                    </div>
                    {!isRead && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        disabled={markingId === item.id}
                        className="shrink-0 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {markingId === item.id ? "..." : "✓ Read"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PUBLIC ANNOUNCEMENTS */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-3">📢 Announcements ({announcements.length})</h4>
        {announcements.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4">
            No announcements yet.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item, i) => (
              <div
                key={item.id || `ann-${i}`}
                className="bg-white rounded-xl shadow-sm border border-l-4 border-l-blue-400 p-4"
              >
                <h5 className="font-semibold text-gray-800">
                  {item.title || "Announcement"}
                </h5>
                <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">
                  {item.message || item.content || "No content."}
                </p>
                {item.created_at && (
                  <small className="text-gray-400 mt-3 block">
                    Posted {formatDateTime(item.created_at)}
                  </small>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


export default ParentNotifications;