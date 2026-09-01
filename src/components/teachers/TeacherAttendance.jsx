import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

// =====================================================
// ✅ BOOTSTRAP ICONS USAGE NOTE
// =====================================================
// Ensure Bootstrap Icons is loaded in your index.html:
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

// =====================================================
// SPINNER
// =====================================================
const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
  </div>
);

// =====================================================
// BUTTON SPINNER
// =====================================================
const ButtonSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
);

// =====================================================
// SAFE ARRAY HELPER
// =====================================================
const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.assignments)) return data.assignments;
  return [];
};

// =====================================================
// SAFE VALUE HELPER
// =====================================================
const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

// =====================================================
// BOOLEAN HELPER
// =====================================================
const isTrue = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "True" ||
    value === "TRUE"
  );
};

// =====================================================
// NORMALIZE ATTENDANCE STATUS
// =====================================================
const normalizeStatus = (status) => {
  const value = String(status || "").trim().toLowerCase();
  if (value === "present") return "present";
  if (value === "absent") return "absent";
  if (value === "excused") return "excused";
  return "present";
};

// =====================================================
// CONVERT FRONTEND STATUS TO BACKEND STATUS
// =====================================================
const backendStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "absent") return "Absent";
  if (normalized === "excused") return "Excused";
  return "Present";
};

// =====================================================
// GET CLASS NAME
// =====================================================
const getClassName = (classItem) => {
  if (!classItem) return "Unknown Class";
  if (typeof classItem === "string") return classItem;
  return (
    firstValue(
      classItem.name,
      classItem.class_name,
      classItem.classroom_name
    ) ||
    (classItem.grade
      ? `${classItem.grade}${classItem.stream ? ` ${classItem.stream}` : ""}`
      : `Class ${classItem.id || ""}`)
  );
};

// =====================================================
// STATUS BADGE
// =====================================================
const getStatusBadgeClass = (status) => {
  const normalized = normalizeStatus(status);
  const map = {
    present: "bg-green-100 text-green-800",
    absent: "bg-red-100 text-red-800",
    excused: "bg-blue-100 text-blue-800",
  };
  return map[normalized] || "bg-gray-100 text-gray-800";
};

// =====================================================
// MAIN COMPONENT
// =====================================================
const TeacherAttendance = () => {
  const [activeTab, setActiveTab] = useState("mark");
  const [assignments, setAssignments] = useState([]);
  const [classTeacherAssignments, setClassTeacherAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notificationResult, setNotificationResult] = useState(null);
  const [attendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [history, setHistory] = useState([]);

  // =====================================================
  // FETCH TEACHER ASSIGNMENTS
  // =====================================================
  const fetchMyAssignments = useCallback(async () => {
    try {
      setLoadingClasses(true);
      setError("");
      setSuccess("");
      setNotificationResult(null);

      console.log("📤 Fetching teacher assignments...");
      const { data } = await api.get("assignments/");
      console.log("✅ Raw assignments:", data);

      const allAssignments = getArray(data);
      const activeAssignments = allAssignments.filter(
        (assignment) =>
          assignment &&
          assignment.id &&
          assignment.is_active !== false &&
          assignment.is_active !== "false" &&
          assignment.is_active !== 0
      );
      console.log("✅ Active assignments:", activeAssignments);

      setAssignments(activeAssignments);

      const classTeachers = activeAssignments.filter((assignment) =>
        isTrue(assignment.is_class_teacher)
      );
      console.log("✅ Class-Teacher assignments:", classTeachers);

      setClassTeacherAssignments(classTeachers);

      if (classTeachers.length > 0) {
        setSelectedAssignment(classTeachers[0]);
      } else {
        setSelectedAssignment(null);
      }
    } catch (err) {
      console.error("❌ Fetch assignments error:", err.response?.data || err.message);
      setAssignments([]);
      setClassTeacherAssignments([]);
      setSelectedAssignment(null);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to load your teacher assignments."
      );
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  // =====================================================
  // CREATE SUBMISSION
  // =====================================================
  const createSubmission = useCallback(async (assignmentId) => {
    if (!assignmentId) return null;
    try {
      console.log("📤 Creating attendance submission for assignment:", assignmentId);
      const { data } = await api.post("attendance/submissions/create/", {
        assignment: assignmentId,
      });
      console.log("✅ Submission created:", data);

      const sid = data.submission || data.submission_id || data.id;
      if (!sid) throw new Error("Submission ID not returned");

      setSubmissionId(sid);
      return sid;
    } catch (err) {
      console.error("❌ Create submission error:", err.response?.data || err.message);
      const errorData = err.response?.data || {};
      setError(
        errorData.error ||
          errorData.detail ||
          errorData.message ||
          "Failed to create attendance session."
      );
      return null;
    }
  }, []);

  // =====================================================
  // FETCH STUDENTS
  // =====================================================
  const fetchStudents = useCallback(async (assignment) => {
    if (!assignment?.id) {
      setStudents([]);
      setSubmissionId(null);
      return;
    }

    try {
      setLoadingStudents(true);
      setError("");
      setSuccess("");
      setNotificationResult(null);

      console.log("📤 Loading students for assignment:", assignment.id);

      if (!isTrue(assignment.is_class_teacher)) {
        setStudents([]);
        setSubmissionId(null);
        setError("Only the Class Teacher can mark attendance.");
        return;
      }

      const subId = await createSubmission(assignment.id);
      if (!subId) return;

      const { data } = await api.get(`attendance/mark/?assignment=${assignment.id}`);
      console.log("✅ Attendance/mark response:", data);

      const returnedSubmissionId = data.submission || data.submission_id || subId;
      setSubmissionId(returnedSubmissionId);

      const rawStudents = getArray(data.students);
      console.log("✅ Raw students:", rawStudents);

      const studentList = rawStudents.map((student) => {
        const status = normalizeStatus(student.status);
        return {
          id: student.student || student.id,
          admission_number: student.admission_number || student.admission_no || "N/A",
          name:
            firstValue(
              student.name,
              `${student.first_name || ""} ${student.last_name || ""}`.trim()
            ) || "Student",
          status,
          remarks: student.remarks || "",
        };
      });
      console.log("✅ Normalized student list:", studentList);

      setStudents(studentList);
    } catch (err) {
      console.error("❌ Students error:", err.response?.data || err.message);
      setStudents([]);
      setSubmissionId(null);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to load students."
      );
    } finally {
      setLoadingStudents(false);
    }
  }, [createSubmission]);

  // =====================================================
  // EFFECT: Load students when assignment changes
  // =====================================================
  useEffect(() => {
    if (selectedAssignment) {
      fetchStudents(selectedAssignment);
    } else {
      setStudents([]);
      setSubmissionId(null);
    }
  }, [selectedAssignment, fetchStudents]);

  // =====================================================
  // FETCH ATTENDANCE HISTORY
  // =====================================================
  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setError("");
      console.log("📤 Loading attendance history...");

      const { data } = await api.get("attendance/teacher/history/");
      console.log("✅ Attendance history:", data);

      setHistory(getArray(data));
    } catch (err) {
      console.error("❌ History error:", err.response?.data || err.message);
      setHistory([]);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to load attendance history."
      );
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // =====================================================
  // LOAD ASSIGNMENTS ON MOUNT
  // =====================================================
  useEffect(() => {
    fetchMyAssignments();
  }, [fetchMyAssignments]);

  // =====================================================
  // LOAD HISTORY WHEN TAB CHANGES
  // =====================================================
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // =====================================================
  // HANDLE CLASS SELECTION
  // =====================================================
  const handleAssignmentChange = (event) => {
    const assignmentId = event.target.value;
    setError("");
    setSuccess("");
    setNotificationResult(null);
    setStudents([]);
    setSubmissionId(null);

    if (!assignmentId) {
      setSelectedAssignment(null);
      return;
    }

    const assignment = classTeacherAssignments.find(
      (item) => String(item.id) === String(assignmentId)
    );

    if (!assignment) {
      setSelectedAssignment(null);
      setError("Selected assignment is not a Class Teacher assignment.");
      return;
    }

    setSelectedAssignment(assignment);
  };

  // =====================================================
  // MARK STUDENT STATUS
  // =====================================================
  const markStatus = (studentId, status) => {
    const normalized = normalizeStatus(status);
    console.log("✏️ Marking student", studentId, "as", normalized);

    setStudents((prev) =>
      prev.map((student) =>
        String(student.id) === String(studentId)
          ? {
              ...student,
              status: normalized,
              remarks: normalized === "present" ? "" : student.remarks || "",
            }
          : student
      )
    );
    setSuccess("");
    setError("");
    setNotificationResult(null);
  };

  // =====================================================
  // UPDATE REMARKS
  // =====================================================
  const updateRemarks = (studentId, remarks) => {
    setStudents((prev) =>
      prev.map((student) =>
        String(student.id) === String(studentId) ? { ...student, remarks } : student
      )
    );
    setError("");
    setSuccess("");
    setNotificationResult(null);
  };

  // =====================================================
  // SAVE ATTENDANCE
  // =====================================================
  const saveAttendance = async () => {
    if (!selectedAssignment) {
      setError("Please select your class first.");
      return;
    }
    if (!isTrue(selectedAssignment.is_class_teacher)) {
      setError("Only the Class Teacher can mark attendance.");
      return;
    }
    if (!submissionId) {
      setError("Attendance session not ready — select class again.");
      return;
    }
    if (students.length === 0) {
      setError("No students to mark.");
      return;
    }

    // Validate remarks for absent/excused
    const missingRemarks = students.filter((student) => {
      const status = normalizeStatus(student.status);
      return (status === "absent" || status === "excused") && !student.remarks?.trim();
    });
    if (missingRemarks.length > 0) {
      setError(`Add remarks for: ${missingRemarks.map((s) => s.name).join(", ")}`);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setNotificationResult(null);

      const payload = {
        submission: Number(submissionId),
        records: students.map((student) => ({
          student: Number(student.id),
          status: backendStatus(student.status),
          remarks: String(student.remarks || "").trim(),
        })),
      };
      console.log("📤 Saving attendance — payload:", payload);

      const { data } = await api.post("attendance/mark/", payload);
      console.log("✅ Save response:", data);

      const sent = Number(data.notifications_sent || 0);
      const withoutParent = Array.isArray(data.students_without_parent)
        ? data.students_without_parent
        : [];
      const notificationErrors = Array.isArray(data.notification_errors)
        ? data.notification_errors
        : [];
      const parentsNotified = Array.isArray(data.parents_notified)
        ? data.parents_notified
        : [];

      setNotificationResult({ sent, withoutParent, notificationErrors, parentsNotified });

      if (sent > 0) {
        setSuccess(
          `✅ Attendance saved. ${sent} parent notification${sent === 1 ? "" : "s"} sent.`
        );
      } else if (withoutParent.length > 0) {
        setSuccess("✅ Saved — some students have no linked parent.");
      } else if (notificationErrors.length > 0) {
        setSuccess("✅ Saved — some notifications failed.");
      } else {
        setSuccess(data.message || "✅ Attendance saved successfully.");
      }

      if (activeTab === "history") fetchHistory();
    } catch (err) {
      console.error("❌ Save error:", err.response?.data || err.message);
      const ed = err.response?.data || {};
      setError(ed.message || ed.error || ed.detail || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (loadingClasses) return <Spinner />;

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <i className="bi bi-calendar-check text-green-600"></i> Attendance
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          <i className="bi bi-calendar3"></i> Date: {attendanceDate}
        </p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
            activeTab === "mark"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("mark")}
        >
          <i className="bi bi-pencil-square"></i> Mark Attendance
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
            activeTab === "history"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("history")}
        >
          <i className="bi bi-clock-history"></i> My History
        </button>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="card bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
          <i className="bi bi-check-circle-fill mr-2"></i> {success}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <i className="bi bi-exclamation-triangle-fill mr-2"></i> {error}
        </div>
      )}

      {/* NOTIFICATION RESULT */}
      {notificationResult && (
        <div className="card border border-blue-200 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <i className="bi bi-bell"></i> Parent Notification Result
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-gray-500">Notifications Sent</p>
              <p className="text-xl font-bold text-green-600">
                {notificationResult.sent}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-gray-500">No Parent Linked</p>
              <p className="text-xl font-bold text-orange-600">
                {notificationResult.withoutParent.length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-gray-500">Notification Errors</p>
              <p className="text-xl font-bold text-red-600">
                {notificationResult.notificationErrors.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MARK ATTENDANCE TAB */}
      {activeTab === "mark" && (
        <>
          {classTeacherAssignments.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-5xl mb-4">
                <i className="bi bi-journal-x text-gray-400"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-800">No Class-Teacher Assignment</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                Attendance can only be marked by the teacher assigned as the Class Teacher.
              </p>
            </div>
          ) : (
            <>
              {/* SELECT CLASS */}
              <div className="card">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <i className="bi bi-building"></i> Select Class
                </label>
                <select
                  className="milk-input w-full"
                  value={selectedAssignment?.id || ""}
                  onChange={handleAssignmentChange}
                  disabled={saving || loadingStudents}
                >
                  <option value="">-- Choose your class --</option>
                  {classTeacherAssignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.classroom_name || getClassName(a.classroom)} — Class Teacher
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECTED CLASS INFO */}
              {selectedAssignment && (
                <div className="card bg-green-50 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Classroom</p>
                      <p className="font-semibold">
                        {selectedAssignment.classroom_name ||
                          getClassName(selectedAssignment.classroom)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Subject</p>
                      <p className="font-semibold">
                        {selectedAssignment.subject_name || "Subject"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Assignment ID</p>
                      <p className="font-semibold">{selectedAssignment.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STUDENTS LIST */}
              {selectedAssignment && selectedAssignment.id && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="bi bi-people"></i> Students
                  </h2>

                  {loadingStudents ? (
                    <Spinner />
                  ) : students.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="bi bi-person-x text-4xl text-gray-400"></i>
                      <p className="text-gray-500 mt-3">No students found in this class.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {students.map((student) => {
                          const status = normalizeStatus(student.status);
                          const needsRemarks = status === "absent" || status === "excused";
                          return (
                            <div
                              key={student.id}
                              className={`border rounded-lg p-4 bg-white ${
                                status === "absent"
                                  ? "border-red-200"
                                  : status === "excused"
                                  ? "border-blue-200"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                                <div>
                                  <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <i className="bi bi-person-circle text-gray-500"></i>
                                    {student.name}
                                  </p>
                                  <p className="text-sm text-gray-500 ml-6">
                                    Adm: {student.admission_number}
                                  </p>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                                    status
                                  )}`}
                                >
                                  {status === "present" && <i className="bi bi-check-circle me-1"></i>}
                                  {status === "absent" && <i className="bi bi-x-circle me-1"></i>}
                                  {status === "excused" && <i className="bi bi-info-circle me-1"></i>}
                                  {status.toUpperCase()}
                                </span>
                              </div>

                              {/* STATUS BUTTONS */}
                              <div className="flex flex-wrap gap-2 ml-6">
                                <button
                                  type="button"
                                  onClick={() => markStatus(student.id, "present")}
                                  disabled={saving}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    status === "present"
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-green-100"
                                  }`}
                                >
                                  <i className="bi bi-check-lg"></i> Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => markStatus(student.id, "absent")}
                                  disabled={saving}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    status === "absent"
                                      ? "bg-red-600 text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-red-100"
                                  }`}
                                >
                                  <i className="bi bi-x-lg"></i> Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => markStatus(student.id, "excused")}
                                  disabled={saving}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    status === "excused"
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                                  }`}
                                >
                                  <i className="bi bi-info-lg"></i> Excused
                                </button>
                              </div>

                              {/* REMARKS INPUT */}
                              {needsRemarks && (
                                <div className="mt-3 ml-6">
                                  <label className="block text-sm font-medium text-gray-600 mb-1">
                                    {status === "absent" ? "Reason for Absence" : "Reason for Excused Attendance"}{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="milk-input w-full"
                                    placeholder={
                                      status === "absent"
                                        ? "Enter reason for absence..."
                                        : "Enter reason..."
                                    }
                                    value={student.remarks || ""}
                                    onChange={(e) =>
                                      updateRemarks(student.id, e.target.value)
                                    }
                                    disabled={saving}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* SAVE BUTTON */}
                      <div className="mt-6 pt-4 border-t">
                        <button
                          type="button"
                          className="milk-btn"
                          onClick={saveAttendance}
                          disabled={saving || loadingStudents || students.length === 0}
                        >
                          {saving && <ButtonSpinner />}
                          <i className="bi bi-floppy me-2"></i>
                          {saving ? "Saving Attendance..." : "Save Attendance"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="bi bi-clock-history text-green-600"></i> My Attendance History
          </h2>

          {loadingHistory ? (
            <Spinner />
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <i className="bi bi-journal-text text-4xl text-gray-400"></i>
              <p className="text-gray-500 mt-3">No attendance records yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {record.classroom_name || record.classroom || "Unknown Class"}
                      </p>
                      <p className="text-sm text-gray-500">
                        <i className="bi bi-calendar-event me-1"></i> Date: {record.date || "—"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>{record.student_name || "Student"}</strong> — {record.admission_number || "N/A"}
                  </p>
                  {record.remarks && (
                    <p className="text-sm text-gray-500 mt-1 italic">
                      <i className="bi bi-chat-left-text me-1"></i> Remarks: {record.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;