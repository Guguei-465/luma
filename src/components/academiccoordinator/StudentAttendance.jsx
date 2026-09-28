import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================
const Spinner = () => (
  <div className="flex min-h-[18rem] items-center justify-center px-4">
    <div className="text-center">
      <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      <p className="text-sm text-gray-500">Loading attendance records...</p>
    </div>
  </div>
);

// =====================================================
// STATUS BADGE
// =====================================================
const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();

  let classes =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap";

  if (normalized === "present") {
    classes += " bg-green-50 text-green-700 ring-1 ring-inset ring-green-200";
  } else if (normalized === "absent") {
    classes += " bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  } else if (normalized === "late") {
    classes += " bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200";
  } else if (normalized === "excused") {
    classes += " bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
  } else {
    classes += " bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200";
  }

  return <span className={classes}>{status || "—"}</span>;
};

// =====================================================
// GET STUDENT NAME
// =====================================================
const getStudentName = (student) => {
  if (!student) return "Unknown Student";

  if (student.name && String(student.name).trim()) {
    return String(student.name).trim();
  }

  const name = `${student.first_name || ""} ${student.last_name || ""}`.trim();

  return name || "Unknown Student";
};

// =====================================================
// GET CLASSROOM ID
// =====================================================
const getClassroomId = (student) => {
  if (!student) return null;

  if (
    student.classroom_id !== null &&
    student.classroom_id !== undefined &&
    student.classroom_id !== ""
  ) {
    return student.classroom_id;
  }

  if (student.classroom && typeof student.classroom === "object") {
    return student.classroom.id || student.classroom.pk || null;
  }

  if (
    student.classroom !== null &&
    student.classroom !== undefined &&
    student.classroom !== ""
  ) {
    return student.classroom;
  }

  return null;
};

// =====================================================
// GET CLASS NAME
// =====================================================
const getClassName = (student, classroom) => {
  if (classroom?.grade && classroom?.stream) {
    return `${classroom.grade} ${classroom.stream}`;
  }

  if (student?.classroom_name && String(student.classroom_name).trim()) {
    return String(student.classroom_name).trim();
  }

  if (
    typeof student?.classroom === "string" &&
    student.classroom.trim()
  ) {
    return student.classroom;
  }

  if (classroom?.name && String(classroom.name).trim()) {
    return String(classroom.name).trim();
  }

  return "Unassigned";
};

// =====================================================
// GET TEACHER NAME FROM ASSIGNMENT
// =====================================================
const getAssignmentTeacherName = (assignment) => {
  if (!assignment) return "";

  if (
    assignment.teacher_name &&
    String(assignment.teacher_name).trim()
  ) {
    return String(assignment.teacher_name).trim();
  }

  if (assignment.teacher_first_name || assignment.teacher_last_name) {
    const name = `${assignment.teacher_first_name || ""} ${
      assignment.teacher_last_name || ""
    }`.trim();

    if (name) return name;
  }

  if (assignment.teacher && typeof assignment.teacher === "object") {
    const teacher = assignment.teacher;

    if (teacher.name && String(teacher.name).trim()) {
      return String(teacher.name).trim();
    }

    if (teacher.full_name && String(teacher.full_name).trim()) {
      return String(teacher.full_name).trim();
    }

    const nestedName = `${teacher.first_name || ""} ${
      teacher.last_name || ""
    }`.trim();

    if (nestedName) return nestedName;

    if (teacher.username) return teacher.username;
  }

  if (
    typeof assignment.teacher === "string" &&
    assignment.teacher.trim()
  ) {
    return assignment.teacher.trim();
  }

  return "";
};

// =====================================================
// GET REMARKS
// =====================================================
const getRemarks = (record) => {
  const remarks = record?.remarks || record?.note || "";
  return remarks || "—";
};

// =====================================================
// FORMAT DATE
// =====================================================
const formatDate = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

// =====================================================
// MAIN COMPONENT
// =====================================================
const StudentAttendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [classTeacherName, setClassTeacherName] = useState("Not Assigned");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Student ID is missing.");
      setLoading(false);
      return;
    }

    loadAllData();
  }, [id]);

  // =====================================================
  // LOAD DATA
  // =====================================================
  const loadAllData = async () => {
    setLoading(true);
    setError("");
    setClassTeacherName("Not Assigned");

    try {
      // -----------------------------------------------
      // STUDENT
      // -----------------------------------------------
      const studentRes = await api.get(`students/${id}/`);
      const studentData = studentRes?.data || null;

      setStudentInfo(studentData);

      const classroomId = getClassroomId(studentData);

      // -----------------------------------------------
      // CLASSROOM
      // -----------------------------------------------
      if (classroomId) {
        try {
          const classRes = await api.get(`classes/${classroomId}/`);
          const classroomData = classRes?.data || null;

          setClassroom(classroomData);
        } catch (classErr) {
          console.warn(
            "Could not load classroom:",
            classErr?.response?.status,
            classErr
          );
        }

        // ---------------------------------------------
        // CLASS TEACHER
        // ---------------------------------------------
        try {
          const assignRes = await api.get("assignments/", {
            params: {
              classroom: classroomId,
            },
          });

          const allAssignments = Array.isArray(assignRes?.data)
            ? assignRes.data
            : Array.isArray(assignRes?.data?.results)
            ? assignRes.data.results
            : [];

          const classTeacherAssignment = allAssignments.find(
            (assignment) =>
              assignment.is_class_teacher === true ||
              assignment.is_class_teacher === "true"
          );

          if (classTeacherAssignment) {
            const teacherName = getAssignmentTeacherName(
              classTeacherAssignment
            );

            if (teacherName) {
              setClassTeacherName(teacherName);
            }
          }
        } catch (assignmentErr) {
          console.warn(
            "Could not load assignments:",
            assignmentErr?.response?.status,
            assignmentErr
          );
        }
      }

      // -----------------------------------------------
      // ATTENDANCE
      // -----------------------------------------------
      const attendanceRes = await api.get(
        `attendance/student/${id}/history/`
      );

      const attendanceData = attendanceRes?.data || {};

      const records = Array.isArray(attendanceData?.attendance)
        ? attendanceData.attendance
        : [];

      setAttendance(records);
      setSummary(attendanceData?.summary || null);
    } catch (err) {
      console.error("Failed to load:", err);

      setError(
        err?.response?.status === 404
          ? "Student attendance record was not found."
          : err?.response?.data?.detail ||
              err?.response?.data?.message ||
              "Could not load attendance records."
      );
    } finally {
      setLoading(false);
    }
  };

  const getMarkedByName = () =>
    classTeacherName || "Not Assigned";

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) return <Spinner />;

  // =====================================================
  // ERROR
  // =====================================================
  if (error) {
    return (
      <div className="mx-3 my-4 rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm">
        <div className="mb-3 text-3xl">⚠️</div>

        <p className="text-sm font-medium text-red-600">{error}</p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            ← Back
          </button>

          <button
            onClick={loadAllData}
            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================
  return (
    <div className="min-h-full bg-gray-50 px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-4">

        {/* =================================================
            HEADER
        ================================================= */}
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* Student information */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-lg">
                  📋
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-gray-800">
                    Attendance Records
                  </h1>

                  <p className="text-xs text-gray-500">
                    Student attendance history
                  </p>
                </div>
              </div>

              {studentInfo && (
                <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">

                  <div>
                    <span className="text-gray-400">Student</span>
                    <p className="truncate font-semibold text-gray-700">
                      {getStudentName(studentInfo)}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-400">Admission No.</span>
                    <p className="font-mono font-semibold text-gray-700">
                      {studentInfo.admission_number || "N/A"}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-400">Class</span>
                    <p className="font-semibold text-gray-700">
                      {getClassName(studentInfo, classroom)}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-400">Class Teacher</span>
                    <p
                      className={`font-semibold ${
                        classTeacherName !== "Not Assigned"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {classTeacherName}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={loadAllData}
                title="Refresh attendance"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
              >
                ↻ Refresh
              </button>

              <button
                onClick={() => navigate(-1)}
                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            SUMMARY
            ONE COLUMN ON SMALL DEVICES
            2 COLUMNS ON SM
            4 COLUMNS ON LG
        ================================================= */}
        {summary && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* Total */}
            <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400">
                    Total Days
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-800">
                    {summary.total_days ?? 0}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-sm">
                
                </div>
              </div>
            </div>

            {/* Present */}
            <div className="rounded-xl border border-green-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600">
                    Present
                  </p>
                  <p className="mt-1 text-xl font-bold text-green-700">
                    {summary.present ?? 0}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-sm">
                  
                </div>
              </div>
            </div>

            {/* Absent */}
            <div className="rounded-xl border border-red-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600">
                    Absent
                  </p>
                  <p className="mt-1 text-xl font-bold text-red-700">
                    {summary.absent ?? 0}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-sm">
                  !
                </div>
              </div>
            </div>

            {/* Percentage */}
            <div className="rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600">
                    Attendance %
                  </p>
                  <p className="mt-1 text-xl font-bold text-blue-700">
                    {summary.attendance_percentage ?? 0}%
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm">
                  %
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            ATTENDANCE HISTORY
        ================================================= */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

          {/* Section header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                Attendance History
              </h2>

              <p className="mt-0.5 text-[11px] text-gray-400">
                {attendance.length}{" "}
                {attendance.length === 1 ? "record" : "records"}
              </p>
            </div>

            <span className="rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-500">
              Attendance
            </span>
          </div>

          {/* Empty state */}
          {attendance.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mb-2 text-3xl">📅</div>

              <p className="text-sm font-medium text-gray-600">
                No attendance records found
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Attendance records will appear here once they are recorded.
              </p>
            </div>
          ) : (
            <>
              {/* =================================================
                  MOBILE CARDS
              ================================================= */}
              <div className="divide-y divide-gray-100 md:hidden">
                {attendance.map((record, i) => (
                  <div
                    key={record.id || i}
                    className="px-4 py-3.5 transition hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {formatDate(record.date)}
                        </p>

                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {record.subject_name ||
                            record.subject ||
                            "General"}
                        </p>
                      </div>

                      <StatusBadge status={record.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          Marked By
                        </p>

                        <p className="mt-0.5 truncate text-xs font-medium text-green-700">
                          {getMarkedByName()}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          Remarks
                        </p>

                        <p className="mt-0.5 truncate text-xs text-gray-600">
                          {getRemarks(record)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* =================================================
                  DESKTOP TABLE
              ================================================= */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Subject
                      </th>

                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Marked By
                      </th>

                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Remarks
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {attendance.map((record, i) => (
                      <tr
                        key={record.id || i}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-5 py-3 text-xs font-medium text-gray-700">
                          {formatDate(record.date)}
                        </td>

                        <td className="px-5 py-3">
                          <StatusBadge status={record.status} />
                        </td>

                        <td className="px-5 py-3 text-xs text-gray-600">
                          {record.subject_name ||
                            record.subject ||
                            "General"}
                        </td>

                        <td className="px-5 py-3 text-xs font-semibold text-green-700">
                          {getMarkedByName()}
                        </td>

                        <td className="max-w-xs px-5 py-3 text-xs text-gray-500">
                          {getRemarks(record)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;