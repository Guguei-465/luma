import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const attendanceTabs = [
  { to: "/admin-dashboard/attendance", end: true, icon: "bi bi-calendar-check", label: "Daily Attendance" },
  { to: "/admin-dashboard/attendance/reports", icon: "bi bi-clipboard-data", label: "Attendance Reports" },
];

const DailyAttendance = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load students in selected class
  useEffect(() => {
    if (!selectedClass) return;
    const loadStudents = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`students/?current_class=${encodeURIComponent(selectedClass)}`);
        // Init status as empty for each student
        setStudents(data.map(s => ({
          ...s,
          status: "", // Present / Absent / Late / Excused
          remarks: ""
        })));
      } catch {
        toast.error("Failed to load students for this class");
      } finally { setLoading(false); }
    };
    loadStudents();
  }, [selectedClass]);

  const handleStatusChange = (studentId, status) => {
    setStudents(prev => prev.map(s => s.id === studentId ? {...s, status} : s));
  };

  const handleRemarkChange = (studentId, remarks) => {
    setStudents(prev => prev.map(s => s.id === studentId ? {...s, remarks} : s));
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({...s, status})));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!students.every(s => s.status)) return toast.warn("Please mark attendance for every student");
    setSaving(true);
    try {
await api.post("attendance/create/", {
        class: selectedClass,
        date: attendanceDate,
        records: students.map(s => ({
          student_id: s.id,
          status: s.status,
          remarks: s.remarks
        }))
      });
      toast.success("✅ Attendance saved successfully!");
    } catch {
      toast.error("❌ Failed to save attendance");
    } finally { setSaving(false); }
  };

return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Attendance Management</h2>
        <p className="text-gray-500 mt-1">Mark daily attendance and generate reports</p>
      </div>

      <AdminSubNav items={attendanceTabs} title="Attendance Overview" />

      {/* Filters */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Select Class *</label>
            <select className="milk-input" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required>
              <option value="">-- Choose Class --</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Form 1">Form 1</option>
              <option value="Form 2">Form 2</option>
              <option value="Form 3">Form 3</option>
              <option value="Form 4">Form 4</option>
            </select>
          </div>
          <div>
            <label className="form-label">Attendance Date</label>
            <input type="date" className="milk-input" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading students...</p>}
      {!selectedClass && <p className="text-gray-500">Select a class to start marking</p>}

      {students.length > 0 && (
        <form onSubmit={handleSubmit}>
          {/* Quick Mark Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" onClick={() => markAll("Present")} className="px-3 py-1 rounded bg-green-100 text-green-800 font-medium">Mark All Present</button>
            <button type="button" onClick={() => markAll("Absent")} className="px-3 py-1 rounded bg-red-100 text-red-800 font-medium">Mark All Absent</button>
            <button type="button" onClick={() => markAll("Late")} className="px-3 py-1 rounded bg-yellow-100 text-yellow-800 font-medium">Mark All Late</button>
          </div>

          {/* Attendance Table */}
          <div className="card overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="p-3 text-left w-2/5">Student Name</th>
                  <th className="p-3 text-center w-2/5">Status</th>
                  <th className="p-3 text-left w-1/5">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{s.first_name} {s.last_name}<br/><small className="text-gray-500">{s.admission_number}</small></td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <label className={`px-2 py-1 rounded cursor-pointer ${s.status==="Present"?"bg-green-500 text-white":"bg-gray-100"}`}>
                          <input type="radio" name={`att_${s.id}`} value="Present" checked={s.status==="Present"} onChange={()=>handleStatusChange(s.id,"Present")} className="hidden"/> Present
                        </label>
                        <label className={`px-2 py-1 rounded cursor-pointer ${s.status==="Absent"?"bg-red-500 text-white":"bg-gray-100"}`}>
                          <input type="radio" name={`att_${s.id}`} value="Absent" checked={s.status==="Absent"} onChange={()=>handleStatusChange(s.id,"Absent")} className="hidden"/> Absent
                        </label>
                        <label className={`px-2 py-1 rounded cursor-pointer ${s.status==="Late"?"bg-yellow-500 text-white":"bg-gray-100"}`}>
                          <input type="radio" name={`att_${s.id}`} value="Late" checked={s.status==="Late"} onChange={()=>handleStatusChange(s.id,"Late")} className="hidden"/> Late
                        </label>
                      </div>
                    </td>
                    <td className="p-3"><input type="text" className="milk-input text-sm" placeholder="Reason / Note" value={s.remarks} onChange={(e)=>handleRemarkChange(s.id,e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="submit" disabled={saving} className="milk-btn w-full max-w-md mx-auto block">
            {saving ? "Saving Attendance..." : "Save All Attendance Records"}
          </button>
        </form>
      )}
    </div>
  );
};

export default DailyAttendance;