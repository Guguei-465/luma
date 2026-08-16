import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import FeedbackAlert from "../ui/FeedbackAlert";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center py-16">
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
  </div>
);

// =====================================================
// FORMAT MONEY
// =====================================================

const formatMoney = (amount) => {
  return `KES ${Number(amount || 0).toLocaleString()}`;
};

// =====================================================
// ACCOUNTANT DASHBOARD
// =====================================================

const AccountantDashboard = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    total_expected: 0,
    total_collected: 0,
    total_balance: 0,
    total_payments: 0,
  });

  const [recentPayments, setRecentPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // =================================================
      // 1. LOAD ACCOUNTANT DASHBOARD STATS
      // =================================================

      const statsRes = await api.get(
        "fees/dashboard/"
      );

      console.log(
        "Accountant dashboard response:",
        statsRes.data
      );

      setStats({
        total_students:
          Number(statsRes.data?.students || 0),

        total_expected:
          Number(statsRes.data?.total_expected || 0),

        total_collected:
          Number(statsRes.data?.total_paid || 0),

        total_balance:
          Number(statsRes.data?.total_balance || 0),

        total_payments:
          Number(statsRes.data?.payments || 0),
      });

      // =================================================
      // 2. LOAD RECENT PAYMENTS
      // =================================================

      const paymentsRes = await api.get(
        "fees/payments/"
      );

      console.log(
        "Payments response:",
        paymentsRes.data
      );

      let payments = [];

      if (Array.isArray(paymentsRes.data)) {
        payments = paymentsRes.data;
      } else if (
        Array.isArray(paymentsRes.data?.results)
      ) {
        payments = paymentsRes.data.results;
      }

      // Sort newest first and show only 5
      payments = [...payments]
        .sort(
          (a, b) =>
            new Date(
              b.payment_date || b.created_at || 0
            ) -
            new Date(
              a.payment_date || a.created_at || 0
            )
        )
        .slice(0, 5);

      setRecentPayments(payments);

    } catch (err) {
      console.error(
        "Dashboard load failed:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setError(
        "Could not load accountant dashboard data. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setSuccess("");
      setError("");

      await fetchDashboardData();

      setSuccess(
        "Dashboard refreshed successfully."
      );

    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <Spinner />;
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="space-y-8 p-6 md:p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bg-white rounded-xl shadow p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              Accountant Dashboard
            </h1>

            <p className="text-gray-500 mt-3 text-lg">
              Manage school fees, payments and
              financial reports.
            </p>

          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-3 rounded-lg transition"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Dashboard"}
          </button>

        </div>

        {/* Alerts */}

        <div className="mt-5">

          {success && (
            <FeedbackAlert
              type="success"
              message={success}
              onDismiss={() => setSuccess("")}
            />
          )}

          {error && (
            <FeedbackAlert
              type="error"
              message={error}
              onDismiss={() => setError("")}
            />
          )}

        </div>

      </div>

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* STUDENTS */}

        <div className="bg-white rounded-xl shadow p-7">

          <p className="text-gray-500 text-lg">
            Students
          </p>

          <h2 className="text-4xl font-bold mt-3 text-gray-800">
            {stats.total_students.toLocaleString()}
          </h2>

          <p className="text-sm text-gray-400 mt-2">
            Students with fee accounts
          </p>

        </div>

        {/* EXPECTED */}

        <div className="bg-white rounded-xl shadow p-7">

          <p className="text-gray-500 text-lg">
            Expected Fees
          </p>

          <h2 className="text-3xl font-bold mt-3 text-green-600">
            {formatMoney(stats.total_expected)}
          </h2>

          <p className="text-sm text-gray-400 mt-2">
            Total fees expected
          </p>

        </div>

        {/* COLLECTED */}

        <div className="bg-white rounded-xl shadow p-7">

          <p className="text-gray-500 text-lg">
            Collected
          </p>

          <h2 className="text-3xl font-bold mt-3 text-purple-600">
            {formatMoney(stats.total_collected)}
          </h2>

          <p className="text-sm text-gray-400 mt-2">
            Total amount paid
          </p>

        </div>

        {/* BALANCE */}

        <div className="bg-white rounded-xl shadow p-7">

          <p className="text-gray-500 text-lg">
            Outstanding Balance
          </p>

          <h2 className="text-3xl font-bold mt-3 text-red-500">
            {formatMoney(stats.total_balance)}
          </h2>

          <p className="text-sm text-gray-400 mt-2">
            Fees still outstanding
          </p>

        </div>

      </div>

      {/* =================================================
          PAYMENT COUNT
      ================================================= */}

      <div className="bg-white rounded-xl shadow p-7">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-gray-500">
              Total Payments
            </p>

            <h2 className="text-3xl font-bold text-gray-800 mt-2">
              {stats.total_payments.toLocaleString()}
            </h2>

          </div>

          <div className="text-4xl">
            💰
          </div>

        </div>

      </div>

      {/* =================================================
          RECENT PAYMENTS + OUTSTANDING
      ================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* =================================================
            RECENT PAYMENTS
        ================================================= */}

        <div className="bg-white rounded-xl shadow overflow-hidden">

          <div className="border-b px-8 py-6 flex justify-between items-center">

            <div>

              <h2 className="font-semibold text-xl">
                Recent Fee Payments
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Latest payment transactions
              </p>

            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-blue-600 hover:underline disabled:opacity-60"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>

                  <th className="text-left p-4 text-sm font-semibold">
                    Student
                  </th>

                  <th className="text-left p-4 text-sm font-semibold">
                    Amount
                  </th>

                  <th className="text-left p-4 text-sm font-semibold">
                    Status
                  </th>

                  <th className="text-left p-4 text-sm font-semibold">
                    Date
                  </th>

                </tr>

              </thead>

              <tbody>

                {recentPayments.length === 0 ? (

                  <tr>

                    <td
                      colSpan="4"
                      className="text-center py-10 text-gray-500"
                    >
                      No fee payments found.
                    </td>

                  </tr>

                ) : (

                  recentPayments.map(
                    (payment, index) => {

                      const status =
                        payment.payment_status ||
                        payment.status ||
                        "—";

                      return (

                        <tr
                          key={
                            payment.id ||
                            index
                          }
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="p-4">

                            <p className="font-medium text-gray-800">
                              {payment.student_name ||
                                payment.student_fee_student_name ||
                                payment.student ||
                                "—"}
                            </p>

                          </td>

                          <td className="p-4 font-medium text-green-600">

                            {formatMoney(
                              payment.amount ||
                              payment.amount_paid ||
                              0
                            )}

                          </td>

                          <td className="p-4">

                            <span
                              className={
                                status ===
                                "SUCCESS"
                                  ? "px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                                  : status ===
                                    "PENDING"
                                  ? "px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"
                                  : "px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
                              }
                            >
                              {status}
                            </span>

                          </td>

                          <td className="p-4 text-sm text-gray-500">

                            {payment.payment_date
                              ? new Date(
                                  payment.payment_date
                                ).toLocaleDateString()
                              : payment.created_at
                              ? new Date(
                                  payment.created_at
                                ).toLocaleDateString()
                              : "—"}

                          </td>

                        </tr>

                      );

                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =================================================
            OUTSTANDING BALANCE
        ================================================= */}

        <div className="bg-white rounded-xl shadow">

          <div className="border-b px-8 py-6">

            <h2 className="font-semibold text-xl">
              Outstanding Balances
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Total unpaid school fees
            </p>

          </div>

          {stats.total_balance > 0 ? (

            <div className="p-10 text-center">

              <div className="text-5xl mb-4">
                💰
              </div>

              <p className="text-3xl font-bold text-orange-600">
                {formatMoney(
                  stats.total_balance
                )}
              </p>

              <p className="text-gray-500 mt-4">
                Total unpaid fees pending
                collection.
              </p>

            </div>

          ) : (

            <div className="flex flex-col items-center justify-center py-16">

              <div className="text-5xl mb-4">
                ✅
              </div>

              <p className="text-green-600 font-medium text-lg">
                No outstanding balances.
              </p>

            </div>

          )}

        </div>

      </div>

      {/* =================================================
          FINANCIAL REPORTS
      ================================================= */}

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-xl font-semibold text-indigo-600 mb-3">
          Financial Reports
        </h2>

        <p className="text-gray-500 mb-7">
          Generate income summaries, payment
          reports and fee balance reports.
        </p>

        <button
          onClick={() =>
            navigate(
              "/accountant/financial-reports"
            )
          }
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg transition"
        >
          Generate Report
        </button>

      </div>

    </div>
  );
};

export default AccountantDashboard;