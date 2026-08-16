import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-green-600"></div>
  </div>
);

// =====================================================
// SAFE ARRAY HELPER
// =====================================================

const getArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.notifications)) {
    return data.notifications;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

// =====================================================
// SAFE STRING
// =====================================================

const safeString = (value, fallback = "") => {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value);
};

// =====================================================
// NOTIFICATION TYPE
// =====================================================

const getNotificationType = (notification) => {
  return safeString(
    notification?.notification_type ||
      notification?.type ||
      notification?.category ||
      ""
  ).toLowerCase();
};

// =====================================================
// CHECK ATTENDANCE NOTIFICATION
// =====================================================

const isAttendanceNotification = (
  notification
) => {
  return (
    getNotificationType(
      notification
    ) === "attendance"
  );
};

// =====================================================
// FORMAT DATE
// =====================================================

const formatDateTime = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  } catch {
    return String(value);
  }
};

// =====================================================
// GET ATTENDANCE STATUS FROM NOTIFICATION
//
// Usually the status is already contained in the title:
// "Attendance: John — Absent"
//
// We also support an explicit status field if the
// backend serializer provides one.
// =====================================================

const getAttendanceStatus = (
  notification
) => {
  const explicitStatus =
    notification?.attendance_status ||
    notification?.status;

  if (explicitStatus) {
    return safeString(
      explicitStatus
    ).toLowerCase();
  }

  const title = safeString(
    notification?.title
  ).toLowerCase();

  if (title.includes("absent")) {
    return "absent";
  }

  if (title.includes("excused")) {
    return "excused";
  }

  if (title.includes("present")) {
    return "present";
  }

  return "";
};

// =====================================================
// ATTENDANCE STATUS STYLE
// =====================================================

const getAttendanceStatusStyle = (
  status
) => {
  switch (
    safeString(status).toLowerCase()
  ) {
    case "absent":
      return {
        badge:
          "bg-red-100 text-red-700",
        border:
          "border-l-red-500",
        icon: "❌",
      };

    case "excused":
      return {
        badge:
          "bg-blue-100 text-blue-700",
        border:
          "border-l-blue-500",
        icon: "ℹ️",
      };

    case "present":
      return {
        badge:
          "bg-green-100 text-green-700",
        border:
          "border-l-green-500",
        icon: "✅",
      };

    default:
      return {
        badge:
          "bg-gray-100 text-gray-700",
        border:
          "border-l-gray-400",
        icon: "📚",
      };
  }
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const ParentNotifications = () => {
  // ===================================================
  // STATE
  // ===================================================

  const [notifications, setNotifications] =
    useState([]);

  const [announcements, setAnnouncements] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // FETCH ANNOUNCEMENTS + PERSONAL NOTIFICATIONS
  // =====================================================

  const fetchAll = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        // =================================================
        // KEEP YOUR EXISTING BACKEND PATHS
        // =================================================

        const [
          annRes,
          notifRes,
        ] = await Promise.all([
          api.get("/anouncements/"),
          api.get("/notifiations/"),
        ]);

        // =================================================
        // NORMALIZE RESPONSES
        // =================================================

        const announcementList =
          getArray(annRes.data);

        const notificationList =
          getArray(notifRes.data);

        // =================================================
        // STORE
        // =================================================

        setAnnouncements(
          announcementList
        );

        setNotifications(
          notificationList
        );

        // =================================================
        // DEBUG
        // =================================================

        console.log(
          "📢 Parent announcements:",
          announcementList
        );

        console.log(
          "🔔 Parent notifications:",
          notificationList
        );

        // =================================================
        // ATTENDANCE NOTIFICATIONS
        // =================================================

        const attendanceNotifications =
          notificationList.filter(
            isAttendanceNotification
          );

        console.log(
          "📚 Attendance notifications:",
          attendanceNotifications
        );

        console.log(
          "📚 Attendance notification count:",
          attendanceNotifications.length
        );

      } catch (err) {
        console.error(
          "❌ Parent notifications load error:",
          err.response?.status,
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data?.detail ||
            err.response?.data?.error ||
            "Failed to load updates. Please try again."
        );

        setAnnouncements([]);
        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // =====================================================
  // LOAD ON PAGE OPEN
  // =====================================================

  useEffect(() => {
    fetchAll(false);
  }, [fetchAll]);

  // =====================================================
  // ATTENDANCE NOTIFICATIONS
  // =====================================================

  const attendanceNotifications =
    notifications.filter(
      isAttendanceNotification
    );

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    await fetchAll(true);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <Spinner />;
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="space-y-4">

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-medium">
            {error}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
        >
          {refreshing
            ? "Refreshing..."
            : "Try Again"}
        </button>

      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Updates & Notifications
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            School announcements and personal alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
        >
          {refreshing ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Refreshing...
            </>
          ) : (
            <>
              🔄 Refresh
            </>
          )}
        </button>

      </div>

      {/* =================================================
          ANNOUNCEMENTS
      ================================================= */}

      <div>

        <h4 className="text-lg font-semibold text-gray-700 mb-3">
          📢 Announcements
        </h4>

        {announcements.length === 0 ? (

          <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4">
            No announcements available yet.
          </div>

        ) : (

          <div className="space-y-3">

            {announcements.map(
              (item, index) => (

                <div
                  key={
                    item.id ||
                    `announcement-${index}`
                  }
                  className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-400 p-4 transition-all hover:shadow"
                >

                  <div className="flex items-start gap-3">

                    <div className="text-xl">
                      📢
                    </div>

                    <div className="flex-1">

                      <h5 className="font-semibold text-gray-800">
                        {item.title ||
                          "School Announcement"}
                      </h5>

                      <p className="text-gray-600 text-sm mt-1">
                        {item.message ||
                          item.content ||
                          "No message available."}
                      </p>

                      {item.created_at && (
                        <small className="text-gray-400 mt-2 block">
                          Posted{" "}
                          {formatDateTime(
                            item.created_at
                          )}
                        </small>
                      )}

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* =================================================
          ATTENDANCE NOTIFICATIONS
      ================================================= */}

      <div>

        <div className="flex items-center justify-between mb-3">

          <h4 className="text-lg font-semibold text-gray-700">
            📚 Attendance Notifications
          </h4>

          {attendanceNotifications.length >
            0 && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              {attendanceNotifications.length}
            </span>
          )}

        </div>

        {attendanceNotifications.length ===
        0 ? (

          <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4">
            No attendance notifications at the moment.
          </div>

        ) : (

          <div className="space-y-3">

            {attendanceNotifications.map(
              (item, index) => {

                const attendanceStatus =
                  getAttendanceStatus(
                    item
                  );

                const style =
                  getAttendanceStatusStyle(
                    attendanceStatus
                  );

                return (
                  <div
                    key={
                      item.id ||
                      `attendance-${index}`
                    }
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${style.border} p-4 transition-all hover:shadow ${
                      item.is_read
                        ? "opacity-90"
                        : ""
                    }`}
                  >

                    <div className="flex items-start gap-3">

                      {/* ICON */}

                      <div className="text-2xl flex-shrink-0">
                        {style.icon}
                      </div>

                      {/* CONTENT */}

                      <div className="flex-1 min-w-0">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                          <h5 className="font-semibold text-gray-800">
                            {item.title ||
                              "Attendance Update"}
                          </h5>

                          {/* STATUS */}

                          {attendanceStatus && (
                            <span
                              className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold capitalize ${style.badge}`}
                            >
                              {attendanceStatus}
                            </span>
                          )}

                        </div>

                        {/* MESSAGE */}

                        <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                          {item.message ||
                            "Your child has an attendance update."}
                        </p>

                        {/* DATE */}

                        {item.created_at && (
                          <small className="text-gray-400 mt-2 block">
                            {formatDateTime(
                              item.created_at
                            )}
                          </small>
                        )}

                        {/* READ STATUS */}

                        <div className="mt-2">

                          {item.is_read ? (
                            <span className="text-xs text-gray-400">
                              ✓ Read
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              New
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* =================================================
          ALL PERSONAL NOTIFICATIONS
      ================================================= */}

      <div>

        <h4 className="text-lg font-semibold text-gray-700 mb-3">
          🔔 Your Notifications
        </h4>

        {notifications.length === 0 ? (

          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-4">
            No personal notifications at the moment.
          </div>

        ) : (

          <div className="space-y-3">

            {notifications.map(
              (item, index) => {

                const isAttendance =
                  isAttendanceNotification(
                    item
                  );

                const attendanceStatus =
                  isAttendance
                    ? getAttendanceStatus(
                        item
                      )
                    : "";

                const style =
                  isAttendance
                    ? getAttendanceStatusStyle(
                        attendanceStatus
                      )
                    : {
                        border:
                          item.is_read
                            ? "border-l-gray-400"
                            : "border-l-green-500",
                        icon: "🔔",
                      };

                return (
                  <div
                    key={
                      item.id ||
                      `notification-${index}`
                    }
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${style.border} p-4 transition-all hover:shadow ${
                      item.is_read
                        ? "opacity-90"
                        : ""
                    }`}
                  >

                    <div className="flex items-start gap-3">

                      {/* ICON */}

                      <div className="text-xl flex-shrink-0">
                        {style.icon}
                      </div>

                      {/* CONTENT */}

                      <div className="flex-1 min-w-0">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                          <h5 className="font-semibold text-gray-800">
                            {item.title ||
                              "Notification"}
                          </h5>

                          {!item.is_read && (
                            <span className="flex-shrink-0 w-fit px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              New
                            </span>
                          )}

                        </div>

                        <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                          {item.message ||
                            "You have a new notification."}
                        </p>

                        {/* ATTENDANCE STATUS */}

                        {isAttendance &&
                          attendanceStatus && (
                            <div className="mt-2">

                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${style.badge}`}
                              >
                                Attendance:{" "}
                                {
                                  attendanceStatus
                                }
                              </span>

                            </div>
                          )}

                        {/* DATE */}

                        {item.created_at && (
                          <small className="text-gray-400 mt-2 block">
                            {formatDateTime(
                              item.created_at
                            )}
                          </small>
                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

    </div>
  );
};

export default ParentNotifications;