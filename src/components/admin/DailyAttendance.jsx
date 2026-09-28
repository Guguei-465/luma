import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const attendanceTabs = [
  { to: "/admin-dashboard/attendance", end: true, icon: "bi bi-calendar-check", label: "Attendance Lookup" },
  { to: "/admin-dashboard/attendance/reports", icon: "bi bi-clipboard-data", label: "Attendance Reports" },
];

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

// =====================================================
// NOTE
//
// Only the assigned CLASS TEACHER can mark attendance
// (backend permission: IsAssignedClassTeacher). Admin's
// role here is to look up existing attendance records —
// not to mark it. This page is a read-only lookup tool
// with class / student / date / status filters.
// =====================================================
const DailyAttendance = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);

  // ── Load classes + students once ──
  useEffect(() => {
    const loadLists = async () => {
      try {
        const [classesRes, studentsRes] = await Promise.all([
          api.get("classes/"),
          api.get("students/"),
        ]);
        setClassrooms(getArray(classesRes.data));
        setStudents(getArray(studentsRes.data));
      } catch {
        toast.error("Failed to load classes / students list");
      } finally {
        setLoadingLists(false);
      }
    };
    loadLists();
  }, []);

  // Students visible in the class dropdown filter
  const studentsInSelectedClass = useMemo(() => {
    if (!selectedClass) return students;
    return students.filter((s) => String(s.classroom) === String(selectedClass));
  }, [students, selectedClass]);

  // Reset the selected student if it falls outside the chosen class
  useEffect(() => {
    if (
      selectedStudent &&
      !studentsInSelectedClass.some((s) => String(s.id) === String(selectedStudent))
    ) {
      setSelectedStudent("");
      setStudentInfo(null);
      setSummary(null);
      setRecords([]);
    }
  }, [studentsInSelectedClass, selectedStudent]);

  const fetchHistory = async () => {
    if (!selectedStudent) {
      toast.warn("Select a student first");
      return;
    }
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`attendance/student/${selectedStudent}/`);
      setStudentInfo(data.student);
      setSummary(data.summary);
      setRecords(data.attendance || []);
    } catch {
      toast.error("Failed to load attendance history");
      setStudentInfo(null);
      setSummary(null);
      setRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Apply date range + status filters client-side ──
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [records, fromDate, toDate, statusFilter]);

  const filteredSummary = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === "Present").length;
    const absent = filteredRecords.filter((r) => r.status === "Absent").length;
    const excused = filteredRecords.filter((r) => r.status === "Excused").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, excused, percentage };
  }, [filteredRecords]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Attendance Lookup</h2>
        <p className="text-gray-500 mt-1">
          Look up a student's saved attendance history. Attendance is marked
          by the student's class teacher.
        </p>
      </div>

      <AdminSubNav items={attendanceTabs} title="Attendance Overview" />

      {/* Filters */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Filter by Class</label>
            <select
              className="milk-input"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={loadingLists}
            >
              <option value="">All Classes</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.grade} {c.stream}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Student *</label>
            <select
              className="milk-input"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={loadingLists}
            >
              <option value="">
                {loadingLists ? "Loading students..." : "Select a student"}
              </option>
              {studentsInSelectedClass.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} — {s.admission_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="milk-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="milk-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="milk-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused</option>
            </select>
          </div>
        </div>

        <button onClick={fetchHistory} className="milk-btn" disabled={!selectedStudent || loadingHistory}>
          {loadingHistory ? "Loading..." : "Look Up Attendance"}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-3 text-center">
            <p className="text-sm text-gray-600">Records Shown</p>
            <p className="text-xl font-bold">{filteredSummary.total}</p>
          </div>
          <div className="card p-3 text-center bg-green-50">
            <p className="text-sm text-green-700">Present</p>
            <p className="text-xl font-bold text-green-700">{filteredSummary.present}</p>
          </div>
          <div className="card p-3 text-center bg-red-50">
            <p className="text-sm text-red-700">Absent</p>
            <p className="text-xl font-bold text-red-700">{filteredSummary.absent}</p>
          </div>
          <div className="card p-3 text-center bg-teal-50">
            <p className="text-sm text-teal-700">Attendance %</p>
            <p className="text-xl font-bold text-teal-700">{filteredSummary.percentage}%</p>
          </div>
        </div>
      )}

      {studentInfo && (
        <p className="text-sm text-gray-600 mb-3">
          Showing history for <span className="font-medium">{studentInfo.name}</span> ({studentInfo.admission_number}) — {studentInfo.classroom}
        </p>
      )}

      {/* Record List */}
      {loadingHistory && <p className="text-gray-500">Loading attendance history...</p>}
      {!loadingHistory && summary && filteredRecords.length === 0 && (
        <p className="text-gray-500">No attendance records match your filters</p>
      )}

      {filteredRecords.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-3">{new Date(r.date).toLocaleDateString("en-KE")}</td>
                  <td className="p-3">{r.classroom}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      r.status === "Present" ? "bg-green-100 text-green-700" :
                      r.status === "Absent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
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

export default DailyAttendance;
