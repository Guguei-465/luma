import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

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
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.assignments)) {
    return data.assignments;
  }

  return [];
};

// =====================================================
// SAFE VALUE HELPER
// =====================================================

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
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
//
// IMPORTANT:
// Backend uses:
// Present
// Absent
// Excused
//
// Frontend uses:
// present
// absent
// excused
// =====================================================

const normalizeStatus = (status) => {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (value === "present") {
    return "present";
  }

  if (value === "absent") {
    return "absent";
  }

  if (value === "excused") {
    return "excused";
  }

  return "present";
};

// =====================================================
// CONVERT FRONTEND STATUS TO BACKEND STATUS
// =====================================================

const backendStatus = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "absent") {
    return "Absent";
  }

  if (normalized === "excused") {
    return "Excused";
  }

  return "Present";
};

// =====================================================
// CLASS NAME
// =====================================================

const getClassName = (classItem) => {
  if (!classItem) {
    return "Unknown Class";
  }

  if (typeof classItem === "string") {
    return classItem;
  }

  return (
    firstValue(
      classItem.name,
      classItem.class_name,
      classItem.classroom_name
    ) ||
    (classItem.grade
      ? `${classItem.grade}${
          classItem.stream
            ? ` ${classItem.stream}`
            : ""
        }`
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

  return (
    map[normalized] ||
    "bg-gray-100 text-gray-800"
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const TeacherAttendance = () => {
  // ===================================================
  // TABS
  // ===================================================

  const [activeTab, setActiveTab] = useState("mark");

  // ===================================================
  // ASSIGNMENTS
  // ===================================================

  const [assignments, setAssignments] = useState([]);

  const [
    classTeacherAssignments,
    setClassTeacherAssignments,
  ] = useState([]);

  const [
    selectedAssignment,
    setSelectedAssignment,
  ] = useState(null);

  // ===================================================
  // ATTENDANCE
  // ===================================================

  const [submissionId, setSubmissionId] =
    useState(null);

  const [students, setStudents] = useState([]);

  // ===================================================
  // LOADING
  // ===================================================

  const [loadingClasses, setLoadingClasses] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  // ===================================================
  // MESSAGES
  // ===================================================

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ===================================================
  // NOTIFICATION RESULT
  // ===================================================

  const [notificationResult, setNotificationResult] =
    useState(null);

  // ===================================================
  // DATE
  // ===================================================

  const [attendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ===================================================
  // HISTORY
  // ===================================================

  const [history, setHistory] = useState([]);

  // =====================================================
  // FETCH TEACHER ASSIGNMENTS
  // =====================================================

  const fetchMyAssignments = useCallback(
    async () => {
      try {
        setLoadingClasses(true);

        setError("");
        setSuccess("");

        setNotificationResult(null);

        console.log(
          "Fetching actual teacher assignments..."
        );

        const { data } = await api.get(
          "assignments/"
        );

        console.log(
          " Raw assignments response:",
          data
        );

        const allAssignments = getArray(data);

        const activeAssignments =
          allAssignments.filter(
            (assignment) =>
              assignment &&
              assignment.id &&
              assignment.is_active !== false &&
              !(
                assignment.is_active ===
                  "false" ||
                assignment.is_active === 0
              )
          );

        console.log(
          " ACTIVE TEACHER ASSIGNMENTS:",
          activeAssignments
        );

        setAssignments(
          activeAssignments
        );

        const classTeachers =
          activeAssignments.filter(
            (assignment) =>
              isTrue(
                assignment.is_class_teacher
              )
          );

        console.log(
          "CLASS TEACHER ASSIGNMENTS:",
          classTeachers
        );

        setClassTeacherAssignments(
          classTeachers
        );

        if (classTeachers.length > 0) {
          setSelectedAssignment(
            classTeachers[0]
          );
        } else {
          setSelectedAssignment(null);
        }
      } catch (err) {
        console.error(
          "Fetch assignments error:",
          err.response?.data ||
            err.message
        );

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
    },
    []
  );

  // =====================================================
  // CREATE / GET ATTENDANCE SUBMISSION
  // =====================================================

  const createSubmission = useCallback(
    async (assignmentId) => {
      if (!assignmentId) {
        return null;
      }

      try {
        console.log(
          "Creating/getting attendance submission:",
          assignmentId
        );

        const { data } =
          await api.post(
            "attendance/create/",
            {
              assignment: assignmentId,
            }
          );

        console.log(
          "Attendance submission response:",
          data
        );

        const sid =
          data.submission ||
          data.submission_id ||
          data.id;

        if (!sid) {
          throw new Error(
            "Attendance submission ID was not returned."
          );
        }

        setSubmissionId(sid);

        return sid;
      } catch (err) {
        console.error(
          "Create submission error:",
          err.response?.data ||
            err.message
        );

        const errorData =
          err.response?.data || {};

        setError(
          errorData.error ||
            errorData.detail ||
            errorData.message ||
            "Failed to create attendance session."
        );

        return null;
      }
    },
    []
  );

  // =====================================================
  // FETCH STUDENTS
  // =====================================================

  const fetchStudents = useCallback(
    async (assignment) => {
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

        console.log(
          "Loading attendance for assignment:",
          assignment.id
        );

        if (
          !isTrue(
            assignment.is_class_teacher
          )
        ) {
          setStudents([]);
          setSubmissionId(null);

          setError(
            "This assignment is not marked as a Class Teacher assignment. Only the Class Teacher can mark attendance."
          );

          return;
        }

        // =================================================
        // CREATE / GET SUBMISSION
        // =================================================

        const subId =
          await createSubmission(
            assignment.id
          );

        if (!subId) {
          return;
        }

        // =================================================
        // LOAD STUDENTS
        // =================================================

        const { data } =
          await api.get(
            `attendance/mark/?assignment=${assignment.id}`
          );

        console.log(
          "Attendance mark response:",
          data
        );

        const returnedSubmissionId =
          data.submission ||
          data.submission_id ||
          subId;

        setSubmissionId(
          returnedSubmissionId
        );

        // =================================================
        // STUDENTS
        // =================================================

        const rawStudents = getArray(
          data.students
        );

        console.log(
          "Raw students:",
          rawStudents
        );

        const studentList =
          rawStudents.map(
            (student) => {
              const status =
                normalizeStatus(
                  student.status
                );

              return {
                id:
                  student.student ||
                  student.id,

                admission_number:
                  student.admission_number ||
                  student.admission_no ||
                  "N/A",

                name:
                  firstValue(
                    student.name,
                    `${student.first_name || ""} ${
                      student.last_name || ""
                    }`.trim()
                  ) || "Student",

                status,

                remarks:
                  student.remarks || "",
              };
            }
          );

        console.log(
          "Normalized students:",
          studentList
        );

        setStudents(
          studentList
        );
      } catch (err) {
        console.error(
          "Students error:",
          err.response?.data ||
            err.message
        );

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
    },
    [createSubmission]
  );

  // =====================================================
  // SELECTED ASSIGNMENT EFFECT
  // =====================================================

  useEffect(() => {
    if (selectedAssignment) {
      fetchStudents(
        selectedAssignment
      );
    } else {
      setStudents([]);
      setSubmissionId(null);
    }
  }, [
    selectedAssignment,
    fetchStudents,
  ]);

  // =====================================================
  // FETCH ATTENDANCE HISTORY
  // =====================================================

  const fetchHistory = useCallback(
    async () => {
      try {
        setLoadingHistory(true);

        setError("");

        const { data } =
          await api.get(
            "attendance/teacher/history/"
          );

        console.log(
          "Attendance history:",
          data
        );

        setHistory(
          getArray(data)
        );
      } catch (err) {
        console.error(
          "History error:",
          err.response?.data ||
            err.message
        );

        setHistory([]);

        setError(
          err.response?.data?.detail ||
            err.response?.data?.error ||
            "Failed to load attendance history."
        );
      } finally {
        setLoadingHistory(false);
      }
    },
    []
  );

  // =====================================================
  // LOAD ASSIGNMENTS
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
  }, [
    activeTab,
    fetchHistory,
  ]);

  // =====================================================
  // HANDLE ASSIGNMENT CHANGE
  // =====================================================

  const handleAssignmentChange = (
    event
  ) => {
    const assignmentId =
      event.target.value;

    setError("");
    setSuccess("");
    setNotificationResult(null);

    setStudents([]);
    setSubmissionId(null);

    if (!assignmentId) {
      setSelectedAssignment(null);
      return;
    }

    const assignment =
      classTeacherAssignments.find(
        (item) =>
          String(item.id) ===
          String(assignmentId)
      );

    if (!assignment) {
      setSelectedAssignment(null);

      setError(
        "The selected assignment is not a Class Teacher assignment."
      );

      return;
    }

    setSelectedAssignment(
      assignment
    );
  };

  // =====================================================
  // MARK STUDENT STATUS
  // =====================================================

  const markStatus = (
    studentId,
    status
  ) => {
    const normalized =
      normalizeStatus(status);

    console.log(
      "Changing student status:",
      {
        studentId,
        status: normalized,
      }
    );

    setStudents(
      (previous) =>
        previous.map(
          (student) => {
            if (
              String(student.id) !==
              String(studentId)
            ) {
              return student;
            }

            return {
              ...student,

              status: normalized,

              // IMPORTANT:
              // Do NOT erase remarks when changing
              // between absent/excused.
              //
              // Only clear remarks when returning
              // to Present.
              remarks:
                normalized ===
                "present"
                  ? ""
                  : student.remarks ||
                    "",
            };
          }
        )
    );

    setSuccess("");
    setError("");
    setNotificationResult(null);
  };

  // =====================================================
  // UPDATE REMARKS
  // =====================================================

  const updateRemarks = (
    studentId,
    remarks
  ) => {
    setStudents(
      (previous) =>
        previous.map(
          (student) =>
            String(student.id) ===
            String(studentId)
              ? {
                  ...student,
                  remarks,
                }
              : student
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
      setError(
        "Please select your class teacher assignment first."
      );
      return;
    }

    if (
      !isTrue(
        selectedAssignment.is_class_teacher
      )
    ) {
      setError(
        "Only the Class Teacher can mark attendance."
      );
      return;
    }

    if (!submissionId) {
      setError(
        "Attendance session has not been created. Please select the class again."
      );
      return;
    }

    if (students.length === 0) {
      setError(
        "No students found in this class."
      );
      return;
    }

    // =================================================
    // CHECK ABSENT / EXCUSED REMARKS
    // =================================================

    const missingRemarks =
      students.filter(
        (student) => {
          const status =
            normalizeStatus(
              student.status
            );

          return (
            (
              status ===
                "absent" ||
              status ===
                "excused"
            ) &&
            !String(
              student.remarks || ""
            ).trim()
          );
        }
      );

    if (
      missingRemarks.length > 0
    ) {
      setError(
        `Add remarks for: ${missingRemarks
          .map(
            (student) =>
              student.name
          )
          .join(", ")}`
      );

      return;
    }

    try {
      setSaving(true);

      setError("");
      setSuccess("");
      setNotificationResult(null);

      // =================================================
      // BUILD EXACT BACKEND PAYLOAD
      // =================================================

      const payload = {
        submission:
          Number(submissionId),

        records:
          students.map(
            (student) => {
              const status =
                normalizeStatus(
                  student.status
                );

              const finalStatus =
                backendStatus(
                  status
                );

              const remarks =
                String(
                  student.remarks ||
                    ""
                ).trim();

              console.log(
                "Student attendance payload:",
                {
                  student:
                    student.id,

                  status:
                    finalStatus,

                  remarks,
                }
              );

              return {
                student:
                  Number(student.id),

                status:
                  finalStatus,

                remarks,
              };
            }
          ),
      };

      console.log(
        "FINAL ATTENDANCE PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      // =================================================
      // SAVE
      // =================================================

      const { data } =
        await api.post(
          "attendance/mark/",
          payload
        );

      console.log(
        "Attendance save response:",
        data
      );

      // =================================================
      // NOTIFICATION RESULT
      // =================================================

      const sent =
        Number(
          data.notifications_sent || 0
        );

      const withoutParent =
        Array.isArray(
          data.students_without_parent
        )
          ? data.students_without_parent
          : [];

      const notificationErrors =
        Array.isArray(
          data.notification_errors
        )
          ? data.notification_errors
          : [];

      const parentsNotified =
        Array.isArray(
          data.parents_notified
        )
          ? data.parents_notified
          : [];

      setNotificationResult({
        sent,
        withoutParent,
        notificationErrors,
        parentsNotified,
      });

      // =================================================
      // SUCCESS MESSAGE
      // =================================================

      if (sent > 0) {
        setSuccess(
          `Attendance marked successfully. ${sent} parent notification${
            sent === 1
              ? ""
              : "s"
          } created.`
        );
      } else if (
        withoutParent.length > 0
      ) {
        setSuccess(
          "Attendance marked successfully, but some students do not have a parent account linked."
        );
      } else if (
        notificationErrors.length > 0
      ) {
        setSuccess(
          "Attendance was saved, but some parent notifications failed."
        );
      } else {
        setSuccess(
          data.message ||
            "Attendance marked successfully."
        );
      }

      // =================================================
      // IMPORTANT:
      //
      // DO NOT REFRESH STUDENTS HERE.
      //
      // Refreshing immediately can overwrite the
      // selected UI state with the backend state.
      // =================================================

      // =================================================
      // REFRESH HISTORY
      // =================================================

      if (
        activeTab === "history"
      ) {
        fetchHistory();
      }
    } catch (err) {
      console.error(
        "Save attendance error:",
        err.response?.data ||
          err.message
      );

      const errorData =
        err.response?.data ||
        {};

      setError(
        errorData.message ||
          errorData.error ||
          errorData.detail ||
          "Failed to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING PAGE
  // =====================================================

  if (loadingClasses) {
    return <Spinner />;
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Attendance
        </h1>

        <p className="text-gray-500 mt-1 text-sm">
          Date: {attendanceDate}
        </p>
      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="flex border-b border-gray-200">

        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "mark"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() =>
            setActiveTab("mark")
          }
        >
          Mark Attendance
        </button>

        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "history"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() =>
            setActiveTab("history")
          }
        >
          My History
        </button>

      </div>

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="card bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
          {success}
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* =================================================
          NOTIFICATION RESULT
      ================================================= */}

      {notificationResult && (
        <div className="card border border-blue-200 bg-blue-50 p-4 rounded-lg">

          <h3 className="font-semibold text-blue-800 mb-3">
            Parent Notification Result
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">

            <div className="bg-white rounded-lg p-3 border">
              <p className="text-gray-500">
                Notifications Sent
              </p>

              <p className="text-xl font-bold text-green-600">
                {
                  notificationResult.sent
                }
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border">
              <p className="text-gray-500">
                Students Without Parent
              </p>

              <p className="text-xl font-bold text-orange-600">
                {
                  notificationResult
                    .withoutParent
                    .length
                }
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border">
              <p className="text-gray-500">
                Notification Errors
              </p>

              <p className="text-xl font-bold text-red-600">
                {
                  notificationResult
                    .notificationErrors
                    .length
                }
              </p>
            </div>

          </div>

          {/* =============================================
              PARENTS NOTIFIED
          ============================================= */}

          {notificationResult.parentsNotified
            .length > 0 && (
            <div className="mt-4">

              <p className="font-semibold text-green-700 mb-2">
                Parents notified:
              </p>

              <div className="space-y-2">

                {notificationResult.parentsNotified.map(
                  (parent, index) => (
                    <div
                      key={
                        parent.notification_id ||
                        index
                      }
                      className="bg-white border border-green-200 rounded-lg p-3 text-sm"
                    >
                      <p className="font-medium text-gray-800">
                        {parent.parent_username}
                      </p>

                      <p className="text-gray-500">
                        Student:{" "}
                        {
                          parent.student_name
                        }
                      </p>

                      <p className="text-gray-400 text-xs mt-1">
                        Notification ID:{" "}
                        {
                          parent.notification_id
                        }
                      </p>
                    </div>
                  )
                )}

              </div>
            </div>
          )}

          {/* =============================================
              STUDENTS WITHOUT PARENT
          ============================================= */}

          {notificationResult.withoutParent
            .length > 0 && (
            <div className="mt-4">

              <p className="font-semibold text-orange-700 mb-2">
                Students without linked parent:
              </p>

              <div className="space-y-2">

                {notificationResult.withoutParent.map(
                  (student, index) => (
                    <div
                      key={
                        student.student_id ||
                        index
                      }
                      className="bg-white border border-orange-200 rounded-lg p-3 text-sm"
                    >
                      <p className="font-medium text-gray-800">
                        {
                          student.student_name
                        }
                      </p>

                      <p className="text-gray-500">
                        Admission No:{" "}
                        {
                          student.admission_number
                        }
                      </p>

                      <p className="text-orange-600 text-xs mt-1">
                        {
                          student.reason
                        }
                      </p>
                    </div>
                  )
                )}

              </div>
            </div>
          )}

          {/* =============================================
              NOTIFICATION ERRORS
          ============================================= */}

          {notificationResult.notificationErrors
            .length > 0 && (
            <div className="mt-4">

              <p className="font-semibold text-red-700 mb-2">
                Notification errors:
              </p>

              <div className="space-y-2">

                {notificationResult.notificationErrors.map(
                  (item, index) => (
                    <div
                      key={
                        item.student_id ||
                        index
                      }
                      className="bg-white border border-red-200 rounded-lg p-3 text-sm"
                    >
                      <p className="font-medium text-gray-800">
                        {
                          item.student_name
                        }
                      </p>

                      <p className="text-red-600 mt-1">
                        {
                          item.error
                        }
                      </p>
                    </div>
                  )
                )}

              </div>
            </div>
          )}

        </div>
      )}

      {/* =================================================
          MARK ATTENDANCE
      ================================================= */}

      {activeTab === "mark" && (
        <>
          {classTeacherAssignments.length ===
          0 ? (
            <div className="card text-center py-12">

              <div className="text-5xl mb-4">
                
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                No Class-Teacher Assignment
              </h2>

              <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                You currently do not have an active
                assignment marked as Class Teacher.
                Attendance can only be marked by the
                teacher assigned as the Class Teacher
                for that classroom.
              </p>

              {assignments.length > 0 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-2xl mx-auto">

                  <p className="font-semibold text-yellow-800">
                    Your active teaching assignments:
                  </p>

                  <div className="mt-3 space-y-2">

                    {assignments.map(
                      (assignment) => (
                        <div
                          key={
                            assignment.id
                          }
                          className="bg-white border rounded-lg p-3"
                        >
                          <p className="font-medium text-gray-800">
                            {assignment.classroom_name ||
                              getClassName(
                                assignment.classroom
                              )}
                            {" — "}
                            {assignment.subject_name ||
                              `Subject ${
                                assignment.subject ||
                                ""
                              }`}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            Assignment ID:{" "}
                            {assignment.id}
                          </p>

                          <p className="text-sm mt-1">
                            Class Teacher:{" "}
                            <span
                              className={
                                isTrue(
                                  assignment.is_class_teacher
                                )
                                  ? "text-green-600 font-semibold"
                                  : "text-red-600 font-semibold"
                              }
                            >
                              {isTrue(
                                assignment.is_class_teacher
                              )
                                ? "YES"
                                : "NO"}
                            </span>
                          </p>
                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            </div>
          ) : (
            <>
              {/* =========================================
                  SELECT CLASS
              ========================================= */}

              <div className="card">

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>

                <select
                  className="milk-input w-full"
                  value={
                    selectedAssignment?.id ||
                    ""
                  }
                  onChange={
                    handleAssignmentChange
                  }
                  disabled={
                    saving ||
                    loadingStudents
                  }
                >

                  <option value="">
                    -- Choose your class --
                  </option>

                  {classTeacherAssignments.map(
                    (assignment) => (
                      <option
                        key={
                          assignment.id
                        }
                        value={
                          assignment.id
                        }
                      >
                        {assignment.classroom_name ||
                          getClassName(
                            assignment.classroom
                          )}

                        {" — "}

                        {assignment.subject_name ||
                          `Subject ${
                            assignment.subject ||
                            ""
                          }`}

                        {" Class Teacher"}
                      </option>
                    )
                  )}

                </select>

                <p className="text-xs text-gray-400 mt-2">
                  These are the classrooms where
                  you are officially assigned as the
                  Class Teacher.
                </p>

              </div>

              {/* =========================================
                  SELECTED ASSIGNMENT
              ========================================= */}

              {selectedAssignment && (
                <div className="card bg-green-50 border border-green-200">

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div>
                      <p className="text-xs text-gray-500">
                        Classroom
                      </p>

                      <p className="font-semibold text-gray-800">
                        {selectedAssignment.classroom_name ||
                          getClassName(
                            selectedAssignment.classroom
                          )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Subject
                      </p>

                      <p className="font-semibold text-gray-800">
                        {selectedAssignment.subject_name ||
                          `Subject ${
                            selectedAssignment.subject ||
                            ""
                          }`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Assignment ID
                      </p>

                      <p className="font-semibold text-gray-800">
                        {
                          selectedAssignment.id
                        }
                      </p>
                    </div>

                  </div>

                  <div className="mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Class Teacher
                    </span>
                  </div>

                </div>
              )}

              {/* =========================================
                  STUDENTS
              ========================================= */}

              {selectedAssignment &&
                selectedAssignment.id && (
                  <div className="card">

                    <h2 className="text-lg font-semibold mb-1 text-gray-800">
                      Students
                    </h2>

                    <p className="text-sm text-gray-500 mb-5">
                      {selectedAssignment.classroom_name ||
                        getClassName(
                          selectedAssignment.classroom
                        )}

                      {" · "}

                      {selectedAssignment.subject_name ||
                        `Subject ${
                          selectedAssignment.subject ||
                          ""
                        }`}
                    </p>

                    {loadingStudents ? (
                      <Spinner />
                    ) : students.length ===
                      0 ? (
                      <div className="text-center py-8">

                        <div className="text-4xl mb-3">
                          👨‍🎓
                        </div>

                        <p className="text-gray-500">
                          No students found in this
                          classroom.
                        </p>

                      </div>
                    ) : (
                      <>
                        {/* =================================
                            STUDENT LIST
                        ================================= */}

                        <div className="space-y-4">

                          {students.map(
                            (student) => {
                              const currentStatus =
                                normalizeStatus(
                                  student.status
                                );

                              const requiresRemarks =
                                currentStatus ===
                                  "absent" ||
                                currentStatus ===
                                  "excused";

                              return (
                                <div
                                  key={
                                    student.id
                                  }
                                  className={`border rounded-lg p-4 space-y-3 bg-white ${
                                    currentStatus ===
                                    "absent"
                                      ? "border-red-200"
                                      : currentStatus ===
                                        "excused"
                                      ? "border-blue-200"
                                      : "border-gray-200"
                                  }`}
                                >

                                  {/* STUDENT INFO */}

                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                                    <div>
                                      <p className="font-semibold text-gray-800">
                                        {
                                          student.name
                                        }
                                      </p>

                                      <p className="text-sm text-gray-500">
                                        Admission No:{" "}
                                        {
                                          student.admission_number
                                        }
                                      </p>
                                    </div>

                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${getStatusBadgeClass(
                                        currentStatus
                                      )}`}
                                    >
                                      {currentStatus.toUpperCase()}
                                    </span>

                                  </div>

                                  {/* STATUS BUTTONS */}

                                  <div className="flex flex-wrap gap-2">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        markStatus(
                                          student.id,
                                          "present"
                                        )
                                      }
                                      disabled={
                                        saving
                                      }
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        currentStatus ===
                                        "present"
                                          ? "bg-green-600 text-white"
                                          : "bg-gray-100 text-gray-700 hover:bg-green-100"
                                      }`}
                                    >
                                      ✓ Present
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        markStatus(
                                          student.id,
                                          "absent"
                                        )
                                      }
                                      disabled={
                                        saving
                                      }
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        currentStatus ===
                                        "absent"
                                          ? "bg-red-600 text-white"
                                          : "bg-gray-100 text-gray-700 hover:bg-red-100"
                                      }`}
                                    >
                                      ✕ Absent
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        markStatus(
                                          student.id,
                                          "excused"
                                        )
                                      }
                                      disabled={
                                        saving
                                      }
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        currentStatus ===
                                        "excused"
                                          ? "bg-blue-600 text-white"
                                          : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                                      }`}
                                    >
                                      ℹ Excused
                                    </button>

                                  </div>

                                  {/* REMARKS */}

                                  {requiresRemarks && (
                                    <div>

                                      <label className="block text-sm font-medium text-gray-600 mb-1">
                                        {currentStatus ===
                                        "absent"
                                          ? "Reason for Absence"
                                          : "Reason for Excused Attendance"}

                                        {" "}

                                        <span className="text-red-500">
                                          *
                                        </span>
                                      </label>

                                      <input
                                        type="text"
                                        className="milk-input w-full"
                                        placeholder={
                                          currentStatus ===
                                          "absent"
                                            ? "Enter reason for absence..."
                                            : "Enter reason for excused attendance..."
                                        }
                                        value={
                                          student.remarks ||
                                          ""
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          updateRemarks(
                                            student.id,
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        disabled={
                                          saving
                                        }
                                      />

                                    </div>
                                  )}

                                </div>
                              );
                            }
                          )}

                        </div>

                        {/* =================================
                            SAVE
                        ================================= */}

                        <div className="mt-6 pt-4 border-t">

                          <button
                            type="button"
                            className="milk-btn"
                            onClick={
                              saveAttendance
                            }
                            disabled={
                              saving ||
                              loadingStudents ||
                              students.length ===
                                0
                            }
                          >

                            {saving && (
                              <ButtonSpinner />
                            )}

                            {saving
                              ? "Saving Attendance..."
                              : "✅ Save Attendance"}

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

      {/* =================================================
          HISTORY
      ================================================= */}

      {activeTab === "history" && (
        <div className="card">

          <h2 className="text-lg font-semibold mb-4">
            My Attendance History
          </h2>

          {loadingHistory ? (
            <Spinner />
          ) : history.length ===
            0 ? (
            <div className="text-center py-8">

              <div className="text-4xl mb-3">
                
              </div>

              <p className="text-gray-500">
                No attendance records found yet.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {history.map(
                (record) => (
                  <div
                    key={
                      record.id
                    }
                    className="border rounded-lg p-4 hover:bg-gray-50 bg-white"
                  >

                    <div className="flex justify-between items-start mb-2 gap-4">

                      <div>

                        <p className="font-semibold text-gray-800">
                          {record.classroom_name ||
                            record.classroom ||
                            "Unknown Class"}
                        </p>

                        <p className="text-sm text-gray-500">
                          Date:{" "}
                          {record.date ||
                            "—"}
                        </p>

                      </div>

                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                          record.status
                        )}`}
                      >
                        {
                          record.status
                        }
                      </span>

                    </div>

                    <p className="text-sm text-gray-600">

                      <strong>
                        {record.student_name ||
                          "Student"}
                      </strong>

                      {" — "}

                      {record.admission_number ||
                        "N/A"}

                    </p>

                    {record.remarks && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        Remarks:{" "}
                        {
                          record.remarks
                        }
                      </p>
                    )}

                  </div>
                )
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default TeacherAttendance;