import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const FeePaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchPayments = async () => {
    try {
      const { data } = await api.get("fees/payments/");
      setPayments(data);
    } catch { toast.error("Failed to load payments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = payments.filter(p =>
    p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.admission_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.receipt_number?.toLowerCase().includes(search.toLowerCase())
  );

  const StatusBadge = ({ paid, total }) => {
    const percent = total>0 ? (paid/total)*100 : 0;
    return <span className={`px-2 py-1 rounded text-xs font-medium ${percent>=100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
      {percent>=100 ? "Fully Paid" : `Part Paid (${percent.toFixed(0)}%)`}
    </span>;
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-5">
        <h2 className="text-2xl font-bold">Student Fee Payments</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search student / receipt..." className="milk-input flex-1" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
      </div>

      {loading && <p className="text-gray-500">Loading payments...</p>}
      {!loading && filtered.length === 0 && <p className="text-gray-500">{search ? "No matches" : "No payments recorded yet"}</p>}

      {filtered.length > 0 && (
        <div className="hidden md:block card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Receipt No.</th>
                <th className="p-3 text-left">Total Fee</th>
                <th className="p-3 text-left">Amount Paid</th>
                <th className="p-3 text-left">Balance</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.student_name}<br/><small className="text-gray-500">{p.admission_number}</small></td>
                  <td className="p-3">{p.receipt_number || "-"}</td>
                  <td className="p-3">KES {p.total_fee?.toLocaleString()}</td>
                  <td className="p-3 text-green-600">KES {p.amount_paid?.toLocaleString()}</td>
                  <td className="p-3 text-red-600 font-medium">KES {Math.max(0, (p.total_fee||0)-(p.amount_paid||0)).toLocaleString()}</td>
                  <td className="p-3"><StatusBadge paid={p.amount_paid} total={p.total_fee} /></td>
                  <td className="p-3 text-xs">{new Date(p.payment_date).toLocaleDateString("en-KE")}</td>
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