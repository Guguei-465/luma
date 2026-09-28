import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import api from "../api/api";

const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600"></div>
  </div>
);

const formatKES = (amount) => {
  const val = Number(amount || 0);
  return `KES ${val.toLocaleString()}`;
};

// Helper: try multiple paths until one works
const tryGetPaths = async (paths, label) => {
  for (const p of paths) {
    try {
      console.log(`🔍 Trying ${label}:`, p);
      const res = await api.get(p);
      const data = res.data?.results || res.data || [];
      if (Array.isArray(data)) {
        console.log(`✅ SUCCESS ${label}:`, p, "→", data.length, "records");
        return { data, path: p };
      }
    } catch {}
  }
  return { data: [], path: null };
};

const FeeManagement = () => {
  const [loading, setLoading] = useState(true);
  const [studentFees, setStudentFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedClass, setSelectedClass] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("📊 Loading Fee Management Data...");
        // Try ALL possible path patterns
        const [feeResult, payResult] = await Promise.all([
          tryGetPaths(
            ["student-fees/", "results/student-fees/", "fee-records/", "dashboard/student-fees/"],
            "Student Fees"
          ),
          tryGetPaths(
            ["payments/", "results/payments/", "fee-payments/", "dashboard/payments/"],
            "Payments"
          ),
        ]);
        const feeList = feeResult.data;
        const payList = payResult.data;
        if (feeList.length === 0) {
          toast.warn("No fee records found — check backend deployment");
        }
        setStudentFees(feeList);
        setPayments(payList);
      } catch (err) {
        console.error("❌ Load Error:", err);
        toast.error("Failed to load fee records");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Extract unique classes ---
  const classes = useMemo(() => {
    const unique = [];
    const seen = new Set();
    studentFees.forEach((f) => {
      const name = f.classroom || f.class_name || f.classroom_name || "Unassigned";
      if (!seen.has(name)) {
        seen.add(name);
        unique.push({ id: name, name });
      }
    });
    return unique;
  }, [studentFees]);

  // --- Enrich fee data with calculated status ---
  const studentFeeStatus = useMemo(() => {
    return studentFees.map((fee) => {
      const totalFee = Number(fee.total_fee || 0);
      const amountPaid = Number(fee.amount_paid || 0);
      const balance = Number(fee.balance || (totalFee - amountPaid) || 0);
      const isPaid = totalFee > 0 ? balance <= 0 : amountPaid > 0;
      return {
        id: fee.id,
        student_name: fee.student_name || "Unknown",
        admission_number: fee.admission_number || "—",
        class_name: fee.classroom || fee.class_name || fee.classroom_name || "Unassigned",
        total_fee: totalFee,
        amount_paid: amountPaid,
        balance: balance,
        is_paid: isPaid,
      };
    });
  }, [studentFees]);

  // --- Apply filters ---
  const filteredStudents = useMemo(() => {
    return studentFeeStatus.filter((s) => {
      const matchClass = selectedClass === "all" || s.class_name === selectedClass;
      const matchStatus =
        paymentStatus === "all" ||
        (paymentStatus === "paid" && s.is_paid) ||
        (paymentStatus === "unpaid" && !s.is_paid);
      return matchClass && matchStatus;
    });
  }, [studentFeeStatus, selectedClass, paymentStatus]);

  // --- Per-class summary ---
  const classSummary = useMemo(() => {
    const summary = {};
    studentFeeStatus.forEach((s) => {
      const cls = s.class_name;
      if (!summary[cls]) summary[cls] = { total: 0, paid: 0, unpaid: 0, total_paid_amount: 0, total_expected: 0 };
      summary[cls].total += 1;
      summary[cls].total_paid_amount += s.amount_paid;
      summary[cls].total_expected += s.total_fee;
      if (s.is_paid) summary[cls].paid += 1;
      else summary[cls].unpaid += 1;
    });
    return Object.entries(summary).map(([name, data]) => ({ name, ...data }));
  }, [studentFeeStatus]);

  // --- Overall totals ---
  const totals = useMemo(() => {
    const paid = studentFeeStatus.filter((s) => s.is_paid);
    const unpaid = studentFeeStatus.filter((s) => !s.is_paid);
    const totalPaid = studentFeeStatus.reduce((sum, s) => sum + s.amount_paid, 0);
    const totalExpected = studentFeeStatus.reduce((sum, s) => sum + s.total_fee, 0);
    const outstanding = totalExpected - totalPaid;
    const collectionRate = totalExpected > 0 ? ((totalPaid / totalExpected) * 100).toFixed(1) : 0;
    return {
      total: studentFeeStatus.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      totalPaidAmount: totalPaid,
      totalExpected,
      outstanding,
      collectionRate,
    };
  }, [studentFeeStatus]);

  if (loading) return <Spinner />;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Fee Management</h1>
        <p className="text-gray-500 mt-1">Track payments, filter by class & payment status</p>
      </div>

      {/* Summary Cards — stacked on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Students</p>
          <h3 className="text-xl font-bold text-gray-800">{totals.total}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-sm text-green-600">Fully Paid</p>
          <h3 className="text-xl font-bold text-green-700">{totals.paidCount}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-sm text-red-600">Not Paid</p>
          <h3 className="text-xl font-bold text-red-700">{totals.unpaidCount}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-500">
          <p className="text-sm text-amber-600">Collected</p>
          <h3 className="text-lg font-bold text-amber-700">{formatKES(totals.totalPaidAmount)}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-sm text-orange-600">Outstanding</p>
          <h3 className="text-lg font-bold text-orange-700">{formatKES(totals.outstanding)}</h3>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <i className="bi bi-funnel me-2 text-green-600"></i>Filter Students
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="paid">✅ Fully Paid</option>
              <option value="unpaid">❌ Not Paid / Partial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Per Class Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <i className="bi bi-building me-2 text-green-600"></i>Fee Status by Class
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="px-4 py-3 text-left rounded-tl-lg">Class</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Paid</th>
                <th className="px-4 py-3 text-center">Not Paid</th>
                <th className="px-4 py-3 text-right">Collected</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Expected</th>
              </tr>
            </thead>
            <tbody>
              {classSummary.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">No data available</td></tr>
              ) : (
                classSummary.map((cls, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{cls.name}</td>
                    <td className="px-4 py-3 text-center">{cls.total}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{cls.paid}</td>
                    <td className="px-4 py-3 text-center text-red-600 font-medium">{cls.unpaid}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{formatKES(cls.total_paid_amount)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatKES(cls.total_expected)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Fees List */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <i className="bi bi-people me-2 text-green-600"></i>Students
          <span className="ml-2 text-sm font-normal text-gray-400">({filteredStudents.length} results)</span>
        </h3>
        {filteredStudents.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No students match your filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2.5 font-semibold text-gray-600">#</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600">Student Name</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600">Admission No.</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600">Class</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Total Fee</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Paid</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Balance</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, i) => (
                  <tr key={student.id || i} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium">{student.student_name}</td>
                    <td className="px-3 py-2.5 text-gray-500">{student.admission_number}</td>
                    <td className="px-3 py-2.5 text-gray-600">{student.class_name}</td>
                    <td className="px-3 py-2.5 text-right">{formatKES(student.total_fee)}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-green-600">{formatKES(student.amount_paid)}</td>
                    <td className={`px-3 py-2.5 text-right font-medium ${student.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {student.balance > 0 ? formatKES(student.balance) : "Fully Paid"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        student.is_paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {student.is_paid ? "✅ Paid" : "❌ Unpaid"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeManagement;