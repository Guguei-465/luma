import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/api";

const AttendanceReports = () => {
  const [filters, setFilters] = useState({ class: "", from_date: "", to_date: "" });
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ present:0, absent:0, late:0, total:0 });
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
const { data } = await api.get("attendance/pending/", { params: filters });
      setRecords(data.records || []);
      setSummary(data.summary || { present:0, absent:0, late:0, total:0 });
    } catch {
      toast.error("Failed to load attendance report");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, []);

  const attendancePercent = summary.total > 0 ? Math.round((summary.present / summary.total)*100) : 0;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-5">Attendance Reports & History</h2>

      {/* Filter Bar */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <label className="form-label">Class</label>
            <select className="milk-input" value={filters.class} onChange={(e)=>setFilters({...filters, class:e.target.value})}>
              <option value="">All Classes</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Form 1">Form 1</option>
            </select>
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="milk-input" value={filters.from_date} onChange={(e)=>setFilters({...filters, from_date:e.target.value})} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="milk-input" value={filters.to_date} onChange={(e)=>setFilters({...filters, to_date:e.target.value})} />
          </div>
        </div>
        <button onClick={fetchReport} className="milk-btn">Generate Report</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-3 text-center">
          <p className="text-sm text-gray-600">Total Sessions</p>
          <p className="text-xl font-bold">{summary.total}</p>
        </div>
        <div className="card p-3 text-center bg-green-50">
          <p className="text-sm text-green-700">Present</p>
          <p className="text-xl font-bold text-green-700">{summary.present}</p>
        </div>
        <div className="card p-3 text-center bg-red-50">
          <p className="text-sm text-red-700">Absent</p>
          <p className="text-xl font-bold text-red-700">{summary.absent}</p>
        </div>
        <div className="card p-3 text-center bg-teal-50">
          <p className="text-sm text-teal-700">Attendance %</p>
          <p className="text-xl font-bold text-teal-700">{attendancePercent}%</p>
        </div>
      </div>

      {/* Record List */}
      {loading && <p className="text-gray-500">Loading report data...</p>}
      {!loading && records.length === 0 && <p className="text-gray-500">No attendance records match your filters</p>}

      {records.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r,i)=>(
                <tr key={i} className="border-b">
                  <td className="p-3">{new Date(r.date).toLocaleDateString("en-KE")}</td>
                  <td className="p-3 font-medium">{r.student_name}</td>
                  <td className="p-3">{r.class_name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      r.status==="Present"?"bg-green-100 text-green-700":
                      r.status==="Absent"?"bg-red-100 text-red-700":"bg-yellow-100 text-yellow-700"
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 text-gray-600">{r.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;