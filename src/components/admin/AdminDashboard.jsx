import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    admin_count: 0,
    academic_coordinator_count: 0,
    teacher_count: 0,
    accountant_count: 0,
    student_count: 0,
    parent_count: 0,
    staff_count: 0,
    active_users: 0,
    inactive_users: 0,
  });

  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH DASHBOARD STATISTICS
  // =====================================================

  const fetchStats = async () => {
    try {
      setLoading(true);

      // -------------------------------------------------
      // FETCH USERS
      // -------------------------------------------------

      const usersResponse = await api.get("accounts/users/");

      const usersData = usersResponse.data;

      const users = Array.isArray(usersData)
        ? usersData
        : usersData?.results || [];

      console.log("Dashboard users:", users);

      // -------------------------------------------------
      // FETCH STUDENTS
      // Students are NOT calculated from user roles.
      // -------------------------------------------------

      const studentsResponse = await api.get("students/");

      const studentsData = studentsResponse.data;

      const students = Array.isArray(studentsData)
        ? studentsData
        : studentsData?.results || [];

      console.log("Dashboard students:", students);

      // =================================================
      // NORMALIZE ROLES
      // =================================================

      const normalizedUsers = users.map((user) => ({
        ...user,
        role: String(user.role || "")
          .trim()
          .toUpperCase(),
      }));

      // =================================================
      // ROLE COUNTS
      // =================================================

      const adminCount = normalizedUsers.filter(
        (user) =>
          user.role === "SUPER_ADMIN" ||
          user.role === "ADMIN" ||
          user.role === "SYSTEM_ADMIN"
      ).length;

      const academicCoordinatorCount = normalizedUsers.filter(
        (user) =>
          user.role === "ACADEMIC_COORDINATOR" ||
          user.role === "ACADEMIC COORDINATOR"
      ).length;

      const teacherCount = normalizedUsers.filter(
        (user) => user.role === "TEACHER"
      ).length;

      const accountantCount = normalizedUsers.filter(
        (user) => user.role === "ACCOUNTANT"
      ).length;

      const parentCount = normalizedUsers.filter(
        (user) => user.role === "PARENT"
      ).length;

      // =================================================
      // STAFF
      //
      // Staff =:
      // Teacher
      // Accountant
      // Super Admin
      // Academic Coordinator
      // =================================================

      const staffCount =
        teacherCount +
        accountantCount +
        adminCount +
        academicCoordinatorCount;

      // =================================================
      // ACTIVE / INACTIVE USERS
      // =================================================

      const activeUsers = normalizedUsers.filter(
        (user) => user.is_active === true
      ).length;

      const inactiveUsers = normalizedUsers.filter(
        (user) => user.is_active === false
      ).length;

      // =================================================
      // UPDATE DASHBOARD
      // =================================================

      setStats({
        total_users: normalizedUsers.length,

        admin_count: adminCount,

        academic_coordinator_count:
          academicCoordinatorCount,

        teacher_count: teacherCount,

        accountant_count: accountantCount,

        student_count: students.length,

        parent_count: parentCount,

        staff_count: staffCount,

        active_users: activeUsers,

        inactive_users: inactiveUsers,
      });
    } catch (err) {
      console.error(
        "Dashboard statistics failed:",
        err.response?.data || err.message
      );

      toast.error("❌ Failed to load dashboard overview");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  useEffect(() => {
    fetchStats();
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="flex justify-center mb-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600"></div>
        </div>

        <p className="text-lg">
          Loading admin overview...
        </p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          Admin Dashboard Overview
        </h2>

        <p className="text-gray-500 mt-1">
          System summary and registered users statistics
        </p>
      </div>

      {/* =================================================
          MAIN STATISTICS
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        {/* TOTAL USERS */}

        <div className="card p-5 bg-blue-50 border-l-4 border-blue-500">
          <p className="text-sm text-blue-700 font-medium">
            Total Registered Users
          </p>

          <p className="text-3xl font-bold text-blue-800 mt-1">
            {stats.total_users}
          </p>
        </div>

        {/* STUDENTS */}

        <div className="card p-5 bg-purple-50 border-l-4 border-purple-500">
          <p className="text-sm text-purple-700 font-medium">
            Total Students
          </p>

          <p className="text-3xl font-bold text-purple-800 mt-1">
            {stats.student_count}
          </p>
        </div>

        {/* ACTIVE USERS */}

        <div className="card p-5 bg-green-50 border-l-4 border-green-500">
          <p className="text-sm text-green-700 font-medium">
            Active Accounts
          </p>

          <p className="text-3xl font-bold text-green-800 mt-1">
            {stats.active_users}
          </p>
        </div>

        {/* INACTIVE USERS */}

        <div className="card p-5 bg-red-50 border-l-4 border-red-500">
          <p className="text-sm text-red-700 font-medium">
            Inactive Accounts
          </p>

          <p className="text-3xl font-bold text-red-800 mt-1">
            {stats.inactive_users}
          </p>
        </div>
      </div>

      {/* =================================================
          STAFF / USER BREAKDOWN
      ================================================= */}

      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Staff & User Breakdown
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        {/* ADMIN */}

        <div className="card p-5 shadow-sm border-l-4 border-teal-500">
          <p className="text-sm text-gray-600 font-medium">
            System Administrators
          </p>

          <p className="text-2xl font-bold text-teal-700 mt-1">
            {stats.admin_count}
          </p>
        </div>

        {/* ACADEMIC COORDINATOR */}

        <div className="card p-5 shadow-sm border-l-4 border-indigo-500">
          <p className="text-sm text-gray-600 font-medium">
            Academic Coordinators
          </p>

          <p className="text-2xl font-bold text-indigo-700 mt-1">
            {stats.academic_coordinator_count}
          </p>
        </div>

        {/* TEACHERS */}

        <div className="card p-5 shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-600 font-medium">
            Teachers
          </p>

          <p className="text-2xl font-bold text-green-700 mt-1">
            {stats.teacher_count}
          </p>
        </div>

        {/* ACCOUNTANTS */}

        <div className="card p-5 shadow-sm border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 font-medium">
            Accountants
          </p>

          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {stats.accountant_count}
          </p>
        </div>

        {/* PARENTS */}

        <div className="card p-5 shadow-sm border-l-4 border-pink-500">
          <p className="text-sm text-gray-600 font-medium">
            Parents / Guardians
          </p>

          <p className="text-2xl font-bold text-pink-700 mt-1">
            {stats.parent_count}
          </p>
        </div>

        {/* STUDENTS */}

        <div className="card p-5 shadow-sm border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 font-medium">
            Students
          </p>

          <p className="text-2xl font-bold text-purple-700 mt-1">
            {stats.student_count}
          </p>
        </div>

        {/* TOTAL STAFF */}

        <div className="card p-5 shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 font-medium">
            Total Staff
          </p>

          <p className="text-2xl font-bold text-blue-700 mt-1">
            {stats.staff_count}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Teachers + Accountants + Admins + Academic Coordinators
          </p>
        </div>

        {/* TOTAL USERS */}

        <div className="card p-5 shadow-sm border-l-4 border-gray-500">
          <p className="text-sm text-gray-600 font-medium">
            Total Users
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {stats.total_users}
          </p>
        </div>
      </div>

      {/* =================================================
          QUICK SUMMARY
      ================================================= */}

      <div className="card p-5 bg-gray-50 border border-gray-200">

        <p className="text-sm text-gray-600 font-medium">
          Quick Summary
        </p>

        <p className="text-gray-700 mt-2 leading-7">
          The system currently has{" "}
          <strong>{stats.student_count}</strong>{" "}
          students and{" "}
          <strong>{stats.total_users}</strong>{" "}
          registered user accounts.

          {" "}There are{" "}
          <strong>{stats.staff_count}</strong>{" "}
          staff members consisting of{" "}
          <strong>{stats.teacher_count}</strong>{" "}
          teachers,{" "}
          <strong>{stats.accountant_count}</strong>{" "}
          accountants,{" "}
          <strong>{stats.admin_count}</strong>{" "}
          administrators, and{" "}
          <strong>{stats.academic_coordinator_count}</strong>{" "}
          academic coordinators.

          {" "}There are also{" "}
          <strong>{stats.parent_count}</strong>{" "}
          parent/guardian accounts.
        </p>
      </div>

    </div>
  );
};

export default AdminDashboard;