import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/api";


// =====================================================
// SPINNER
// =====================================================
const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600"></div>
  </div>
);


// =====================================================
// FORMAT CURRENCY
// =====================================================
const formatKES = (amount) => {
  const val = Number(amount || 0);
  return `KES ${val.toLocaleString()}`;
};


// =====================================================
// MAIN DASHBOARD COMPONENT
// =====================================================
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_students: 0,
    total_teachers: 0,
    total_parents: 0,
    total_classes: 0,
    attendance_percent: 0,
    boys: 0,
    girls: 0,
    total_exams: 0,
    unread_notifications: 0,
  });
  const [feeSummary, setFeeSummary] = useState({ collected: 0, expected: 0, outstanding: 0 });
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, excused: 0, percentage: 0 });
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);


  // =====================================================
  // LOAD ALL DASHBOARD DATA
  // =====================================================
  const loadDashboard = async () => {
    try {
      setLoading(true);
      console.log("📊 Loading Dashboard Data...");

      const dashboardRes = await api.get("dashboard/");
      const data = dashboardRes.data || {};
      console.log("✅ Dashboard Overview:", data);

      const feeRes = await api.get("dashboard/fees/summary/");
      const feeData = feeRes.data || {};
      console.log("💰 Fee Summary:", feeData);

      const attRes = await api.get("dashboard/attendance/today/");
      const attData = attRes.data || {};
      console.log("✅ Attendance Summary:", attData);

      const admRes = await api.get("dashboard/recent-admissions/");
      const admData = admRes.data || [];

      const payRes = await api.get("dashboard/recent-payments/");
      const payData = payRes.data || [];

      const topRes = await api.get("dashboard/top-students/");
      const topData = topRes.data || [];

      const noteRes = await api.get("dashboard/notifications/");
      const noteData = noteRes.data || [];

      // ✅ CORRECT FIELD MAPPING
      setStats({
        total_students: data.total_students || 0,
        total_teachers: data.total_teachers || 0,
        total_parents: data.total_parents || 0,
        total_classes: data.total_classes || 0,
        attendance_percent: Number(data.attendance_today) || 0,
        boys: data.boys || 0,
        girls: data.girls || 0,
        total_exams: data.total_exams || 0,
        unread_notifications: data.unread_notifications || 0,
      });

      setFeeSummary({
        collected: Number(feeData.collected_fee) || 0,
        expected: Number(feeData.expected_fee) || 0,
        outstanding: Number(feeData.outstanding_fee) || 0,
      });

      setAttendance({
        present: attData.present || 0,
        absent: attData.absent || 0,
        excused: attData.excused || 0,
        percentage: Number(attData.attendance_percentage) || 0,
      });

      setRecentAdmissions(admData);
      setRecentPayments(payData);
      setTopStudents(topData);
      setNotifications(noteData);

    } catch (err) {
      console.error("❌ Dashboard Load Error:", err.response?.data || err.message);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDashboard();
  }, []);


  if (loading) return <Spinner />;


  // =====================================================
  // UI — ONE CARD ON PHONE + PARENTS MOVED UP
  // =====================================================
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Admin! Here's what's happening at Luma 200 Academy.</p>
        </div>
        <div className="mt-3 md:mt-0">
          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
            <i className="bi bi-calendar3 me-2"></i>Academic Year • 2024/2025
          </span>
        </div>
      </div>


      {/* ==============================================
          🆕 TOP STATS — PARENTS MOVED UP HERE!
      ============================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* TOTAL STUDENTS */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <i className="bi bi-mortarboard-fill text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Students</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.total_students}</h3>
              <p className="text-xs text-gray-400">{stats.boys} Boys • {stats.girls} Girls</p>
            </div>
          </div>
        </div>

        {/* TOTAL TEACHERS */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <i className="bi bi-person-workspace text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Teachers</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.total_teachers}</h3>
            </div>
          </div>
        </div>

        {/* 🆕 TOTAL PARENTS — MOVED UP! */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <i className="bi bi-people-fill text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Parents</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.total_parents}</h3>
            </div>
          </div>
        </div>

        {/* TOTAL CLASSES */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <i className="bi bi-building text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Classes</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.total_classes}</h3>
            </div>
          </div>
        </div>
      </div>


      {/* ==============================================
          FEE SUMMARY
      ============================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium"><i className="bi bi-wallet2 me-2 text-blue-500"></i>Expected Fee</p>
          <h3 className="text-xl font-bold text-gray-800 mt-1">{formatKES(feeSummary.expected)}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium"><i className="bi bi-currency-exchange me-2 text-green-500"></i>Total Paid</p>
          <h3 className="text-xl font-bold text-green-600 mt-1">{formatKES(feeSummary.collected)}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium"><i className="bi bi-exclamation-triangle me-2 text-red-500"></i>Outstanding</p>
          <h3 className="text-xl font-bold text-red-600 mt-1">{formatKES(feeSummary.outstanding)}</h3>
        </div>
      </div>


      {/* ==============================================
          📱 TODAY'S SUMMARY — ONE FULL CARD ON PHONE!
      ============================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* ✅ ONE FULL CARD on PHONE (col-span-full) */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            <i className="bi bi-list-check me-2 text-green-600"></i>Today's Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{attendance.present}</p>
              <p className="text-sm text-gray-500 mt-1"><i className="bi bi-check-circle me-1"></i>Present</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{attendance.absent}</p>
              <p className="text-sm text-gray-500 mt-1"><i className="bi bi-x-circle me-1"></i>Absent</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-700">{stats.total_exams}</p>
              <p className="text-sm text-gray-500 mt-1"><i className="bi bi-file-text me-1"></i>Exams Today</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-700">{attendance.excused}</p>
              <p className="text-sm text-gray-500 mt-1"><i className="bi bi-person-dash me-1"></i>Excused</p>
            </div>
          </div>
        </div>

        {/* ATTENDANCE CIRCLE — FULL WIDTH ON PHONE */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-5 border border-gray-100 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            <i className="bi bi-graph-up-arrow me-2 text-green-600"></i>Today's Attendance Rate
          </h3>
          <div className="w-28 h-28 mx-auto rounded-full border-8 border-green-500 flex items-center justify-center mb-2">
            <span className="text-2xl font-bold text-green-700">{stats.attendance_percent}%</span>
          </div>
        </div>
      </div>


      {/* ==============================================
          BOTTOM ROW
      ============================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* RECENT ADMISSIONS */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            <i className="bi bi-person-plus me-2 text-green-600"></i>Recent Admissions
          </h3>
          {recentAdmissions.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent admissions</p>
          ) : (
            recentAdmissions.slice(0, 4).map((s, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm font-medium">{s.student_name}</span>
                <span className="text-xs text-gray-400">{s.admission_number}</span>
              </div>
            ))
          )}
        </div>

        {/* RECENT PAYMENTS */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            <i className="bi bi-currency-exchange me-2 text-green-600"></i>Recent Payments
          </h3>
          {recentPayments.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent payments</p>
          ) : (
            recentPayments.slice(0, 4).map((p, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm font-medium">{p.student_name}</span>
                <span className={`text-xs font-bold ${p.payment_status === 'Failed' ? 'text-red-600' : 'text-green-600'}`}>
                  {formatKES(p.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* TOP PERFORMING STUDENTS */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            <i className="bi bi-trophy me-2 text-yellow-500"></i>Top Performing Students
          </h3>
          {topStudents.length === 0 ? (
            <p className="text-gray-400 text-sm">No performance data yet</p>
          ) : (
            topStudents.slice(0, 4).map((s, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm font-medium">
                  {s.position}. {s.student_name}
                </span>
                <span className="text-xs font-bold text-green-600">
                  {s.average_score}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>


      {/* NOTIFICATIONS */}
      {notifications.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            <i className="bi bi-bell-fill me-2 text-red-500"></i>Reminders & Announcements
            {stats.unread_notifications > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {stats.unread_notifications} new
              </span>
            )}
          </h3>
          {notifications.slice(0, 4).map((n, i) => (
            <div key={i} className="py-2 border-b border-gray-50 last:border-0">
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-xs text-gray-400">{n.created_at?.substring(0, 10)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;