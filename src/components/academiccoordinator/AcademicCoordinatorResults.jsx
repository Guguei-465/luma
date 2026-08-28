import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/api";

// ============================================================
// CONSTANTS
// ============================================================
const TERMS = ["Term 1", "Term 2", "Term 3"];

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  approved: "bg-green-100 text-green-700 border border-green-200",
  returned: "bg-red-100 text-red-700 border border-red-200",
  draft: "bg-gray-100 text-gray-700 border border-gray-200",

  present: "bg-green-100 text-green-700 border border-green-200",
  absent: "bg-red-100 text-red-700 border border-red-200",
  excused: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  exempted: "bg-blue-100 text-blue-700 border border-blue-200",
};

const PRESENCE_STATUSES = {
  present: "present",
  absent: "absent",
  excused: "excused",
  exempted: "exempted",
};

// ============================================================
// SPINNER
// ============================================================
const Spinner = ({ size = "2.5rem" }) => (
  <div className="flex items-center justify-center py-12">
    <div
      className="animate-spin rounded-full border-4 border-gray-200 border-t-green-600"
      style={{
        width: size,
        height: size,
      }}
    />
  </div>
);

// ============================================================
// STATUS BADGE
// ============================================================
const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();

  const className =
    STATUS_STYLES[normalized] ||
    "bg-gray-100 text-gray-700 border border-gray-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${className}`}
    >
      {status || "Unknown"}
    </span>
  );
};

// ============================================================
// HELPERS
// ============================================================
const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getId = (value) => {
  if (value !== null && typeof value === "object") {
    return value.id ?? null;
  }

  return value ?? null;
};

const getTeacherName = (teacher) => {
  if (!teacher) return "Unknown Teacher";

  if (teacher.full_name) return teacher.full_name;
  if (teacher.teacher_name) return teacher.teacher_name;
  if (teacher.teacher_full_name) return teacher.teacher_full_name;
  if (teacher.name) return teacher.name;

  if (teacher.user) {
    const nestedName =
      `${teacher.user.first_name || ""} ${
        teacher.user.last_name || ""
      }`.trim();

    if (nestedName) return nestedName;

    if (teacher.user.username) {
      return teacher.user.username;
    }
  }

  const directName =
    `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim();

  if (directName) return directName;

  return (
    teacher.username ||
    teacher.user_name ||
    teacher.employee_number ||
    `Teacher #${teacher.id}`
  );
};

const getTeacherId = (assignment) => {
  if (!assignment) return null;

  const fromTeacher = getId(assignment.teacher);

  if (fromTeacher) {
    return String(fromTeacher);
  }

  const direct = getId(assignment.teacher_id);

  if (direct) {
    return String(direct);
  }

  return null;
};

const getStudentName = (result) => {
  if (!result) return "Unknown Student";

  if (result.student_name) {
    return result.student_name;
  }

  if (result.student?.name) {
    return result.student.name;
  }

  if (result.student?.first_name || result.student?.last_name) {
    return `${result.student.first_name || ""} ${
      result.student.last_name || ""
    }`.trim();
  }

  return `Student #${result.student || ""}`;
};

const getErrorMessage = (
  err,
  fallback = "Something went wrong"
) => {
  return (
    err?.response?.data?.detail ||
    err?.message ||
    fallback
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const AcademicCoordinatorResults = () => {
  // ==========================================================
  // FILTERS
  // ==========================================================
  const [term, setTerm] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [teacher, setTeacher] = useState("");

  // ==========================================================
  // TEACHERS
  // ==========================================================
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // ==========================================================
  // DATA
  // ==========================================================
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState(null);
  const [selectedResults, setSelectedResults] = useState([]);

  // ==========================================================
  // UI
  // ==========================================================
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // FETCH TEACHERS
  // ==========================================================
  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setError("");

    const teacherEndpoints = [
      "assignments/teachers/",
      "accounts/teacher-profile/",
    ];

    let response = null;

    for (const endpoint of teacherEndpoints) {
      try {
        response = await api.get(endpoint);

        console.log(
          `Teachers loaded from: ${endpoint}`
        );

        break;
      } catch (endpointError) {
        console.warn(
          `Teacher endpoint failed: ${endpoint}`
        );
      }
    }

    if (!response) {
      setTeachers([]);
      setLoadingTeachers(false);
      return;
    }

    const data = getArray(response);

    const teacherList = data
      .map((teacher, index) => {
        const rawId =
          teacher.id || getTeacherId(teacher);

        const safeId = rawId ? String(rawId) : "";

        let safeKey = safeId;

        if (!safeKey) {
          if (teacher.employee_number) {
            safeKey = `emp-${teacher.employee_number}`;
          } else if (teacher.user?.username) {
            safeKey = `user-${teacher.user.username}`;
          } else {
            safeKey = `teacher-${index}`;
          }
        }

        return {
          id: safeId,
          key: safeKey,
          name: getTeacherName(teacher),
        };
      })
      .filter((t) => t.id)
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    setTeachers(teacherList);
    setLoadingTeachers(false);
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // ==========================================================
  // FETCH SUBMISSIONS
  // ==========================================================
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const params = {};

    if (term) {
      params.term = term;
    }

    if (academicYear.trim()) {
      params.academic_year = academicYear.trim();
    }

    if (teacher) {
      params.submitted_by = teacher;
    }

    try {
      const response = await api.get(
        "results/result-submissions/",
        { params }
      );

      const data = getArray(response);

      const pending = data.filter(
        (item) =>
          String(item.approval_status || "").toLowerCase() ===
          "pending"
      );

      setSubmissions(pending);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to load submitted results."
        )
      );

      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [term, academicYear, teacher]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // ==========================================================
  // OPEN SUBMISSION
  // ==========================================================
  const openSubmission = useCallback(
    async (submission) => {
      setSelectedSubmission(submission);
      setSelectedResults([]);
      setLoadingResults(true);
      setError("");

      try {
        const response = await api.get(
          "results/results/",
          {
            params: {
              submission: submission.id,
            },
          }
        );

        setSelectedResults(getArray(response));
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to load the submitted marks."
          )
        );

        setSelectedResults([]);
      } finally {
        setLoadingResults(false);
      }
    },
    []
  );

  // ==========================================================
  // CLOSE SUBMISSION
  // ==========================================================
  const closeSubmission = useCallback(() => {
    setSelectedSubmission(null);
    setSelectedResults([]);
    setError("");
  }, []);

  // ==========================================================
  // REFRESH
  // ==========================================================
  const refreshAfterAction = useCallback(async () => {
    closeSubmission();
    await fetchSubmissions();
  }, [closeSubmission, fetchSubmissions]);

  // ==========================================================
  // APPROVE
  // ==========================================================
  const approveSubmission = useCallback(
    async (submission) => {
      const confirmed = window.confirm(
        `Approve results for "${
          submission?.assessment_name ||
          "this assessment"
        }"?`
      );

      if (!confirmed) return;

      setProcessing(true);
      setError("");
      setSuccess("");

      try {
        await api.post(
          `results/result-submissions/${submission.id}/approve/`
        );

        setSuccess(
          "Results approved successfully."
        );

        await refreshAfterAction();
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to approve the results."
          )
        );
      } finally {
        setProcessing(false);
      }
    },
    [refreshAfterAction]
  );

  // ==========================================================
  // RETURN
  // ==========================================================
  const returnSubmission = useCallback(
    async (submission) => {
      const comments = window.prompt(
        "Enter the reason for returning these results:"
      );

      if (comments === null) return;

      if (!comments.trim()) {
        setError(
          "Please provide a reason before returning."
        );

        return;
      }

      setProcessing(true);
      setError("");
      setSuccess("");

      try {
        await api.post(
          `results/result-submissions/${submission.id}/return-results/`,
          {
            coordinator_comments: comments.trim(),
          }
        );

        setSuccess(
          "Results returned to the teacher successfully."
        );

        await refreshAfterAction();
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to return the results."
          )
        );
      } finally {
        setProcessing(false);
      }
    },
    [refreshAfterAction]
  );

  // ==========================================================
  // SUMMARY
  // ==========================================================
  const summary = useMemo(() => {
    const total = selectedResults.length;

    const counts = {
      total,
      present: 0,
      absent: 0,
      excused: 0,
      exempted: 0,
    };

    selectedResults.forEach((item) => {
      const status = String(
        item.status || ""
      ).toLowerCase();

      if (PRESENCE_STATUSES[status]) {
        counts[status] += 1;
      }
    });

    return counts;
  }, [selectedResults]);

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Results Approval
            </h1>

            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Review and approve results submitted by
              teachers.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSubmissions}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4 4l4 4m12 12v-5h-.581m0 0a8.003 8.003 0 01-14.357-3M20 20l-4-4"
                />
              </svg>
            )}

            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ================================================== */}
        {/* SUCCESS */}
        {/* ================================================== */}
        {success && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-green-800 shadow-sm">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z"
                  clipRule="evenodd"
                />
              </svg>

              <span className="text-sm font-medium">
                {success}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}
        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-800 shadow-sm">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 9l-1.879 1.879a1 1 0 101.414 1.414L10 10.414l1.879 1.879a1 1 0 001.414-1.414L11.414 9l1.879-1.879a1 1 0 00-1.414-1.414L10 7.586 8.121 5.707a1 1 0 00-1.414 1.414L8.586 9z"
                  clipRule="evenodd"
                />
              </svg>

              <span className="text-sm font-medium">
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* FILTER CARD */}
        {/* ================================================== */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-bold text-gray-900">
              Filter Results
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Filter pending result submissions by term,
              academic year, or teacher.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

              {/* TERM */}
              <div>
                <label
                  htmlFor="results-term"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Term
                </label>

                <select
                  id="results-term"
                  value={term}
                  onChange={(e) =>
                    setTerm(e.target.value)
                  }
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">All Terms</option>

                  {TERMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-gray-500">
                  Select the academic term.
                </p>
              </div>

              {/* ACADEMIC YEAR */}
              <div>
                <label
                  htmlFor="results-academic-year"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Academic Year
                </label>

                <input
                  id="results-academic-year"
                  type="number"
                  placeholder="e.g. 2026"
                  value={academicYear}
                  onChange={(e) =>
                    setAcademicYear(e.target.value)
                  }
                  min="2000"
                  max="2100"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Enter the academic year manually.
                </p>
              </div>

              {/* TEACHER */}
              <div>
                <label
                  htmlFor="results-teacher"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Teacher
                </label>

                <select
                  id="results-teacher"
                  value={teacher}
                  onChange={(e) =>
                    setTeacher(e.target.value)
                  }
                  disabled={loadingTeachers}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingTeachers
                      ? "Loading teachers..."
                      : teachers.length === 0
                      ? "No assigned teachers found"
                      : "All Assigned Teachers"}
                  </option>

                  {teachers.map((item) => (
                    <option
                      key={item.key}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-gray-500">
                  {loadingTeachers
                    ? "Loading assigned teachers..."
                    : teachers.length > 0
                    ? `${teachers.length} assigned teacher${
                        teachers.length === 1
                          ? ""
                          : "s"
                      } available.`
                    : "No teachers were found."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* PENDING COUNT */}
        {/* ================================================== */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">
            Pending submissions:
          </span>

          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
            {submissions.length}
          </span>
        </div>

        {/* ================================================== */}
        {/* LOADING */}
        {/* ================================================== */}
        {loading ? (
          <Spinner />
        ) : submissions.length === 0 ? (
          /* ================================================== */
          /* EMPTY STATE */
          /* ================================================== */
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              No pending results
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
              There are no teacher-submitted results waiting
              for approval for the selected filters.
            </p>
          </div>
        ) : (
          /* ================================================== */
          /* SUBMISSIONS TABLE */
          /* ================================================== */
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    {[
                      "#",
                      "Assessment",
                      "Subject",
                      "Class",
                      "Term",
                      "Year",
                      "Submitted By",
                      "Status",
                      "Actions",
                    ].map((heading, index) => (
                      <th
                        key={heading}
                        className={`whitespace-nowrap px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-green-700 ${
                          index === 0
                            ? "text-center"
                            : ""
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {submissions.map(
                    (submission, index) => {
                      const assessment =
                        submission?.assessment || {};

                      return (
                        <tr
                          key={submission.id}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium text-gray-500">
                            {index + 1}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {submission.assessment_name ||
                                assessment.name ||
                                `Assessment #${
                                  assessment.id ||
                                  submission.id
                                }`}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                            {assessment.subject_name ||
                              submission.subject_name ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                            {assessment.classroom_name ||
                              submission.classroom_name ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                            {assessment.term ||
                              submission.term ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                            {assessment.academic_year ||
                              submission.academic_year ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-700">
                            {submission.submitted_by_name ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <StatusBadge
                              status={
                                submission.approval_status
                              }
                            />
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap justify-end gap-2">

                              {/* REVIEW */}
                              <button
                                type="button"
                                onClick={() =>
                                  openSubmission(
                                    submission
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                Review
                              </button>

                              {/* APPROVE */}
                              <button
                                type="button"
                                onClick={() =>
                                  approveSubmission(
                                    submission
                                  )
                                }
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Approve
                              </button>

                              {/* RETURN */}
                              <button
                                type="button"
                                onClick={() =>
                                  returnSubmission(
                                    submission
                                  )
                                }
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h10a4 4 0 014 4v1m0 0l4-4m-4 4l-4-4"
                                  />
                                </svg>
                                Return
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* REVIEW MODAL */}
        {/* ================================================== */}
        {selectedSubmission && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeSubmission();
              }
            }}
          >
            <div className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-green-50 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                    Review Submitted Results
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedSubmission.assessment_name ||
                      "Assessment"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeSubmission}
                  disabled={processing}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                  aria-label="Close"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="overflow-y-auto p-5 sm:p-6">

                {/* ASSESSMENT INFO */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  {[
                    {
                      label: "Assessment",
                      value:
                        selectedSubmission.assessment_name,
                    },
                    {
                      label: "Subject",
                      value:
                        selectedSubmission.assessment
                          ?.subject_name ||
                        selectedSubmission.subject_name,
                    },
                    {
                      label: "Classroom",
                      value:
                        selectedSubmission.assessment
                          ?.classroom_name ||
                        selectedSubmission.classroom_name,
                    },
                    {
                      label: "Status",
                      value: selectedSubmission.approval_status,
                      isStatus: true,
                    },
                  ].map(
                    ({
                      label,
                      value,
                      isStatus,
                    }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-green-100 bg-green-50 p-4"
                      >
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                          {label}
                        </p>

                        {isStatus ? (
                          <StatusBadge status={value} />
                        ) : (
                          <p className="text-sm font-bold text-gray-900">
                            {value || "—"}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* SUMMARY */}
                {!loadingResults && (
                  <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

                    {[
                      {
                        label: "Total",
                        value: summary.total,
                        wrapper:
                          "bg-gray-50 border-gray-200",
                        text: "text-gray-700",
                      },
                      {
                        label: "Present",
                        value: summary.present,
                        wrapper:
                          "bg-green-50 border-green-100",
                        text: "text-green-700",
                      },
                      {
                        label: "Absent",
                        value: summary.absent,
                        wrapper:
                          "bg-red-50 border-red-100",
                        text: "text-red-700",
                      },
                      {
                        label: "Excused",
                        value: summary.excused,
                        wrapper:
                          "bg-yellow-50 border-yellow-100",
                        text: "text-yellow-700",
                      },
                      {
                        label: "Exempted",
                        value: summary.exempted,
                        wrapper:
                          "bg-blue-50 border-blue-100",
                        text: "text-blue-700",
                      },
                    ].map(
                      ({
                        label,
                        value,
                        wrapper,
                        text,
                      }) => (
                        <div
                          key={label}
                          className={`rounded-xl border p-4 text-center ${wrapper}`}
                        >
                          <p
                            className={`text-xs font-semibold ${text}`}
                          >
                            {label}
                          </p>

                          <p className="mt-1 text-2xl font-bold text-gray-900">
                            {value}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* RESULTS */}
                {loadingResults ? (
                  <Spinner size="2rem" />
                ) : selectedResults.length === 0 ? (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-800">
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z"
                        />
                      </svg>

                      <span>
                        No student results were found for
                        this submission.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-green-700">
                              #
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-green-700">
                              Student
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-green-700">
                              Status
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-green-700">
                              Marks
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-green-700">
                              Grade
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-green-700">
                              Remarks
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                          {selectedResults.map(
                            (result, index) => (
                              <tr
                                key={result.id}
                                className="transition hover:bg-gray-50"
                              >
                                <td className="px-4 py-4 text-sm font-medium text-gray-500">
                                  {index + 1}
                                </td>

                                <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                  {getStudentName(
                                    result
                                  )}
                                </td>

                                <td className="px-4 py-4">
                                  <StatusBadge
                                    status={
                                      result.status
                                    }
                                  />
                                </td>

                                <td className="px-4 py-4 text-sm font-bold text-gray-900">
                                  {result.marks != null
                                    ? result.marks
                                    : "—"}
                                </td>

                                <td className="px-4 py-4 text-sm text-gray-700">
                                  {result.grade_name ||
                                    result.grade?.level ||
                                    "—"}
                                </td>

                                <td className="max-w-xs px-4 py-4 text-sm text-gray-500">
                                  {result.remarks || "—"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={closeSubmission}
                  disabled={processing}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() =>
                    returnSubmission(
                      selectedSubmission
                    )
                  }
                  disabled={
                    processing || loadingResults
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a4 4 0 014 4v1m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>

                  Return Results
                </button>

                <button
                  type="button"
                  onClick={() =>
                    approveSubmission(
                      selectedSubmission
                    )
                  }
                  disabled={
                    processing || loadingResults
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>

                      Approve Results
                    </>
                  )}
                </button>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicCoordinatorResults;