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
// There is no single "bulk attendance report" endpoint on
// the backend — attendance is only exposed per student
// (attendance/student/<id>/), which already returns a
// present/absent/excused/percentage summary. This page
// builds a class-wide report by calling that endpoint once
// per student in the selected class, then applies the
// date-range / status / search filters client-side.
// =====================================================
const AttendanceReports = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [minAttendance, setMinAttendance] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | percentage

  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [report, setReport] = useState([]); // [{student, records:[...]}]

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

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter((s) => String(s.classroom) === String(selectedClass));
  }, [students, selectedClass]);

  const generateReport = async () => {
    if (!selectedClass) {
      toast.warn("Select a class first");
      return;
    }
    if (classStudents.length === 0) {
      toast.info("This class has no students");
      setReport([]);
      return;
    }

    setLoadingReport(true);
    try {
      const results = await Promise.allSettled(
        classStudents.map((s) => api.get(`attendance/student/${s.id}/`))
      );

      const combined = results.map((res, i) => {
        if (res.status === "fulfilled") {
          return {
            student: res.value.data.student,
            records: res.value.data.attendance || [],
          };
        }
        // Fall back to the basic student record if the lookup failed
        const s = classStudents[i];
        return {
          student: {
            id: s.id,
            name: `${s.first_name} ${s.last_name}`.trim(),
            admission_number: s.admission_number,
          },
          records: [],
        };
      });

      setReport(combined);
    } catch {
      toast.error("Failed to generate attendance report");
    } finally {
      setLoadingReport(false);
    }
  };

  // ── Apply filters + recompute per-student summary ──
  const filteredReport = useMemo(() => {
    const rows = report.map(({ student, records }) => {
      const filteredRecords = records.filter((r) => {
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
        return true;
      });

      const total = filteredRecords.length;
      const present = filteredRecords.filter((r) => r.status === "Present").length;
      const absent = filteredRecords.filter((r) => r.status === "Absent").length;
      const excused = filteredRecords.filter((r) => r.status === "Excused").length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return { student, total, present, absent, excused, percentage };
    });

    let filtered = rows.filter((r) =>
      r.student.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.student.admission_number?.toLowerCase().includes(search.toLowerCase())
    );

    if (minAttendance !== "") {
      const min = Number(minAttendance);
      filtered = filtered.filter((r) => r.total === 0 || r.percentage >= min);
    }

    filtered.sort((a, b) => {
      if (sortBy === "percentage") return a.percentage - b.percentage;
      return (a.student.name || "").localeCompare(b.student.name || "");
    });

    return filtered;
  }, [report, fromDate, toDate, search, minAttendance, sortBy]);

  const classSummary = useMemo(() => {
    const total = filteredReport.reduce((sum, r) => sum + r.total, 0);
    const present = filteredReport.reduce((sum, r) => sum + r.present, 0);
    const absent = filteredReport.reduce((sum, r) => sum + r.absent, 0);
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  }, [filteredReport]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Attendance Reports</h2>
        <p className="text-gray-500 mt-1">Class-wide attendance summary and trends</p>
      </div>

      <AdminSubNav items={attendanceTabs} title="Attendance Overview" />

      {/* Filters */}
      <div className="card p-4 mb-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Class *</label>
            <select
              className="milk-input"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={loadingLists}
            >
              <option value="">
                {loadingLists ? "Loading classes..." : "Select a class"}
              </option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.grade} {c.stream}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="milk-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="milk-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Search Student</label>
            <input type="text" className="milk-input" placeholder="Name / admission no." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Min. Attendance %</label>
            <input type="number" min="0" max="100" className="milk-input" placeholder="e.g. 75" value={minAttendance} onChange={(e) => setMinAttendance(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Sort By</label>
            <select className="milk-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="percentage">Attendance %</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} className="milk-btn w-full" disabled={!selectedClass || loadingReport}>
              {loadingReport ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Class Summary */}
      {report.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-3 text-center">
            <p className="text-sm text-gray-600">Students Shown</p>
            <p className="text-xl font-bold">{filteredReport.length}</p>
          </div>
          <div className="card p-3 text-center bg-green-50">
            <p className="text-sm text-green-700">Present (sum)</p>
            <p className="text-xl font-bold text-green-700">{classSummary.present}</p>
          </div>
          <div className="card p-3 text-center bg-red-50">
            <p className="text-sm text-red-700">Absent (sum)</p>
            <p className="text-xl font-bold text-red-700">{classSummary.absent}</p>
          </div>
          <div className="card p-3 text-center bg-teal-50">
            <p className="text-sm text-teal-700">Class Attendance %</p>
            <p className="text-xl font-bold text-teal-700">{classSummary.percentage}%</p>
          </div>
        </div>
      )}

      {loadingReport && <p className="text-gray-500">Building report — fetching each student's history...</p>}
      {!loadingReport && report.length > 0 && filteredReport.length === 0 && (
        <p className="text-gray-500">No students match your filters</p>
      )}
      {!loadingReport && report.length === 0 && (
        <p className="text-gray-500">Select a class and click "Generate Report" to begin</p>
      )}

      {filteredReport.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Admission No.</th>
                <th className="p-3 text-center">Present</th>
                <th className="p-3 text-center">Absent</th>
                <th className="p-3 text-center">Excused</th>
                <th className="p-3 text-center">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {filteredReport.map((r) => (
                <tr key={r.student.id} className="border-b">
                  <td className="p-3 font-medium">{r.student.name}</td>
                  <td className="p-3">{r.student.admission_number}</td>
                  <td className="p-3 text-center text-green-700">{r.present}</td>
                  <td className="p-3 text-center text-red-700">{r.absent}</td>
                  <td className="p-3 text-center text-yellow-700">{r.excused}</td>
                  <td className="p-3 text-center font-semibold">
                    <span className={r.percentage < 75 ? "text-red-600" : "text-teal-700"}>
                      {r.total > 0 ? `${r.percentage}%` : "—"}
                    </span>
                  </td>
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
