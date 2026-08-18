import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import api from "../api/api";

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const FeePaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchPayments = async () => {
    try {
      const { data } = await api.get("fees/payments/");
      setPayments(getArray(data));
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (methodFilter !== "all" && p.payment_method !== methodFilter) return false;
      if (statusFilter !== "all" && p.payment_status !== statusFilter) return false;
      if (fromDate && p.payment_date < fromDate) return false;
      if (toDate && p.payment_date > toDate) return false;
      if (search) {
        const term = search.toLowerCase();
        const inName = (p.student_name || "").toLowerCase().includes(term);
        const inReceipt = (p.receipt_number || "").toLowerCase().includes(term);
        const inMpesa = (p.mpesa_receipt || "").toLowerCase().includes(term);
        if (!inName && !inReceipt && !inMpesa) return false;
      }
      return true;
    });
  }, [payments, methodFilter, statusFilter, fromDate, toDate, search]);

  const totalAmount = filtered
    .filter((p) => p.payment_status === "Success")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const StatusBadge = ({ status }) => {
    const styles = {
      Success: "bg-green-100 text-green-700",
      Pending: "bg-yellow-100 text-yellow-700",
      Failed: "bg-red-100 text-red-700",
      Cancelled: "bg-gray-200 text-gray-700",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.Pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-4">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">Student Fee Payments</h2>
        <p className="text-gray-500 text-sm">All fee payments recorded across the school</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          type="text" placeholder="Student / receipt no..."
          className="milk-input" value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="milk-input" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
          <option value="all">All Methods</option>
          <option value="Cash">Cash</option>
          <option value="Bank">Bank</option>
          <option value="M-Pesa">M-Pesa</option>
        </select>
        <select className="milk-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Success">Success</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <input type="date" className="milk-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From date" />
        <input type="date" className="milk-input" value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To date" />
      </div>

      {!loading && filtered.length > 0 && (
        <div className="card p-4 mb-5 bg-teal-50 flex justify-between items-center">
          <span className="text-teal-700 font-medium">Total Successful Payments Shown</span>
          <span className="text-teal-800 font-bold text-lg">KES {totalAmount.toLocaleString()}</span>
        </div>
      )}

      {loading && <p className="text-gray-500">Loading payments...</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-gray-500">{payments.length === 0 ? "No payments recorded yet" : "No payments match your filters"}</p>
      )}

      {filtered.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Receipt No.</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Method</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.student_name}</td>
                  <td className="p-3">{p.receipt_number || "-"}</td>
                  <td className="p-3 text-green-600 font-medium">KES {Number(p.amount || 0).toLocaleString()}</td>
                  <td className="p-3">{p.payment_method}</td>
                  <td className="p-3"><StatusBadge status={p.payment_status} /></td>
                  <td className="p-3 text-xs">{p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-KE") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FeePaymentsList;
