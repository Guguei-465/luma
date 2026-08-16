import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/api";

// ============================================================
// SPINNER
// ============================================================

const Spinner = () => (
  <div className="d-flex justify-content-center align-items-center py-5">
    <div
      className="spinner-border text-success"
      role="status"
      style={{
        width: "2.5rem",
        height: "2.5rem",
      }}
    >
      <span className="visually-hidden">
        Loading...
      </span>
    </div>
  </div>
);

// ============================================================
// STATUS BADGE
// ============================================================

const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();

  let className = "badge bg-secondary";

  if (normalized === "pending") {
    className = "badge bg-warning text-dark";
  } else if (normalized === "approved") {
    className = "badge bg-success";
  } else if (normalized === "returned") {
    className = "badge bg-danger";
  } else if (normalized === "draft") {
    className = "badge bg-secondary";
  }

  return (
    <span
      className={`${className} rounded-pill px-3 py-2 fw-medium`}
    >
      {status || "Unknown"}
    </span>
  );
};

// ============================================================
// ✅ SAME HELPERS FROM YOUR WORKING TEACHER PROFILE
// ============================================================

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

const getId = (value) => {
  if (value !== null && typeof value === "object") return value.id ?? null;
  return value ?? null;
};

const getTeacherName = (teacher) => {
  if (!teacher) return "Unknown Teacher";

  if (teacher.full_name) return teacher.full_name;
  if (teacher.teacher_name) return teacher.teacher_name;
  if (teacher.teacher_full_name) return teacher.teacher_full_name;
  if (teacher.name) return teacher.name;

  if (teacher.user) {
    const nestedName = `${teacher.user.first_name || ""} ${teacher.user.last_name || ""}`.trim();
    if (nestedName) return nestedName;
    if (teacher.user.username) return teacher.user.username;
  }

  const directName = `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim();
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
  if (fromTeacher) return String(fromTeacher);

  const direct = getId(assignment.teacher_id);
  if (direct) return String(direct);

  return null;
};

// ============================================================
// GET STUDENT NAME
// ============================================================

const getStudentName = (result) => {
  if (result?.student_name) return result.student_name;
  if (result?.student?.name) return result.student.name;
  if (result?.student?.first_name || result?.student?.last_name) {
    return `${result.student.first_name || ""} ${result.student.last_name || ""}`.trim();
  }
  return `Student #${result?.student || ""}`;
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
  const [selectedSubmission, setSelectedSubmission] = useState(null);
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
  // FETCH TEACHERS — ✅ FIXED: Reads id DIRECTLY from teacher object
  // ==========================================================

  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setError("");

    try {
      const teacherEndpoints = [
        "assignments/teacher-profile/",
        "teacher-profile/",
      ];

      let response = null;
      for (const endpoint of teacherEndpoints) {
        try {
          const res = await api.get(endpoint);
          response = res;
          console.log(`Teacher profiles loaded from: ${endpoint}`, res.data);
          break;
        } catch (endpointError) {
          console.warn(`Teacher endpoint failed: ${endpoint}`, endpointError?.response?.status);
        }
      }

      if (!response) {
        console.error("Could not load TeacherProfile from any endpoint.");
        setTeachers([]);
        return;
      }

      const data = getArray(response);

      // ✅ FIXED: Read id DIRECTLY from teacher object (matches your actual data!)
      const teacherList = data
        .map((teacher, index) => {
          // Your data has id: 1, 2, 3 directly on the object!
          const rawId = teacher.id || getTeacherId(teacher);
          const safeId = rawId ? String(rawId) : "";

          // Build guaranteed-unique key for React
          let safeKey = safeId;
          if (!safeKey) {
            if (teacher.employee_number) safeKey = `emp-${teacher.employee_number}`;
            else if (teacher.user?.username) safeKey = `user-${teacher.user.username}`;
            else safeKey = `teacher-${index}`;
          }

          return {
            id: safeId,
            key: safeKey,
            name: getTeacherName(teacher),
          };
        })
        .filter((t) => t.id) // NOW all teachers pass this filter!
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log("✅ Teachers ready for dropdown:", teacherList);
      setTeachers(teacherList);
    } catch (err) {
      console.error("Failed to load teachers:", err);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
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

    try {
      const params = {};
      if (term) params.term = term;
      if (academicYear.trim()) params.academic_year = academicYear.trim();
      if (teacher) params.submitted_by = teacher;

      const response = await api.get("results/result-submissions/", { params });
      const data = getArray(response);

      const pending = data.filter(
        (item) => String(item.approval_status || "").toLowerCase() === "pending"
      );

      setSubmissions(pending);
    } catch (err) {
      console.error("Failed to load result submissions:", err);
      setError(err?.response?.data?.detail || "Failed to load submitted results.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [term, academicYear, teacher]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openSubmission = async (submission) => {
    setSelectedSubmission(submission);
    setSelectedResults([]);
    setLoadingResults(true);
    setError("");

    try {
      const response = await api.get("results/results/", {
        params: { submission: submission.id },
      });
      setSelectedResults(getArray(response));
    } catch (err) {
      console.error("Failed to load submitted marks:", err);
      setError(err?.response?.data?.detail || "Failed to load the submitted marks.");
      setSelectedResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const closeSubmission = () => {
    setSelectedSubmission(null);
    setSelectedResults([]);
    setError("");
  };

  const approveSubmission = async (submission) => {
    const confirmed = window.confirm(
      `Are you sure you want to approve the results for ${
        submission?.assessment_name || "this assessment"
      }?`
    );
    if (!confirmed) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`results/result-submissions/${submission.id}/approve/`);
      setSuccess("Results approved successfully.");
      setSelectedSubmission(null);
      setSelectedResults([]);
      await fetchSubmissions();
    } catch (err) {
      console.error("Failed to approve results:", err);
      setError(err?.response?.data?.detail || "Failed to approve the results.");
    } finally {
      setProcessing(false);
    }
  };

  const returnSubmission = async (submission) => {
    const comments = window.prompt(
      "Enter the reason for returning these results:"
    );
    if (comments === null) return;
    if (!comments.trim()) {
      setError("Please provide a reason before returning the results.");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await api.post(
        `results/result-submissions/${submission.id}/return-results/`,
        { coordinator_comments: comments.trim() }
      );
      setSuccess("Results returned to the teacher successfully.");
      setSelectedSubmission(null);
      setSelectedResults([]);
      await fetchSubmissions();
    } catch (err) {
      console.error("Failed to return results:", err);
      setError(err?.response?.data?.detail || "Failed to return the results.");
    } finally {
      setProcessing(false);
    }
  };

  const filteredSubmissions = useMemo(() => submissions, [submissions]);

  const summary = useMemo(() => {
    const total = selectedResults.length;
    const present = selectedResults.filter(
      (item) => String(item.status || "").toLowerCase() === "present"
    ).length;
    const absent = selectedResults.filter(
      (item) => String(item.status || "").toLowerCase() === "absent"
    ).length;
    const excused = selectedResults.filter(
      (item) => String(item.status || "").toLowerCase() === "excused"
    ).length;
    const exempted = selectedResults.filter(
      (item) => String(item.status || "").toLowerCase() === "exempted"
    ).length;
    return { total, present, absent, excused, exempted };
  }, [selectedResults]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="container-fluid py-4 px-3 px-md-4 px-lg-5">
      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h3 className="fw-bold mb-2 text-dark">Results Approval</h3>
          <p className="text-muted mb-0">
            Review and approve results submitted by teachers.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-success px-5 py-3 fw-medium d-flex align-items-center justify-content-center gap-2 shadow-sm"
          onClick={fetchSubmissions}
          disabled={loading}
          style={{ minWidth: "140px" }}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status"></span>
          ) : (
            <i className="bi bi-arrow-clockwise"></i>
          )}
          <span>Refresh</span>
        </button>
      </div>

      {/* SUCCESS */}
      {success && (
        <div
          className="alert alert-success alert-dismissible fade show border-0 shadow-sm rounded-3 mb-4"
          role="alert"
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show border-0 shadow-sm rounded-3 mb-4"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {/* FILTER FORM */}
      <div className="card shadow-sm border-0 mb-5 rounded-4">
        <div className="card-body p-4 p-md-5 p-xl-5">
          <div className="mb-5">
            <h5 className="fw-bold text-dark mb-2">Filter Results</h5>
            <p className="text-muted mb-0">
              Filter pending result submissions by term, academic year, or teacher.
            </p>
          </div>

          <div className="row g-4 g-xl-5 align-items-end">
            {/* TERM */}
            <div className="col-12 col-md-4">
              <label
                htmlFor="results-term"
                className="form-label fw-semibold text-dark mb-2"
              >
                Term
              </label>
              <select
                id="results-term"
                className="form-select form-select-lg shadow-sm"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                style={{ minHeight: "52px", fontSize: "1rem" }}
              >
                <option value="">All Terms</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
              <small className="text-muted d-block mt-2">Select the academic term.</small>
            </div>

            {/* ACADEMIC YEAR */}
            <div className="col-12 col-md-4">
              <label
                htmlFor="results-academic-year"
                className="form-label fw-semibold text-dark mb-2"
              >
                Academic Year
              </label>
              <input
                id="results-academic-year"
                type="number"
                className="form-control form-control-lg shadow-sm"
                placeholder="e.g. 2026"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                min="2000"
                max="2100"
                style={{ minHeight: "52px", fontSize: "1rem" }}
              />
              <small className="text-muted d-block mt-2">
                Enter the academic year manually.
              </small>
            </div>

            {/* TEACHER DROPDOWN — ✅ FIXED: Now shows all 3 teachers! */}
            <div className="col-12 col-md-4">
              <label
                htmlFor="results-teacher"
                className="form-label fw-semibold text-dark mb-2"
              >
                Teacher
              </label>
              <select
                id="results-teacher"
                className="form-select form-select-lg shadow-sm"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                disabled={loadingTeachers}
                style={{ minHeight: "52px", fontSize: "1rem" }}
              >
                <option value="">
                  {loadingTeachers
                    ? "Loading teachers..."
                    : teachers.length === 0
                    ? "No assigned teachers found"
                    : "All Assigned Teachers"}
                </option>
                {teachers.map((item) => (
                  <option key={item.key} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <small className="text-muted d-block mt-2">
                {loadingTeachers
                  ? "Loading assigned teachers..."
                  : teachers.length > 0
                  ? `${teachers.length} assigned teacher${teachers.length === 1 ? "" : "s"} available.`
                  : "No teachers were found in TeacherAssignment."}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* PENDING COUNT */}
      <div className="mb-4 d-flex align-items-center flex-wrap gap-3 px-1">
        <span className="fw-semibold text-dark">Pending submissions:</span>
        <span className="badge bg-success rounded-pill px-3 py-2">
          {filteredSubmissions.length}
        </span>
      </div>

      {/* LOADING / EMPTY / TABLE */}
      {loading ? (
        <Spinner />
      ) : filteredSubmissions.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5 px-4">
            <div className="mb-3">
              <i
                className="bi bi-check-circle text-success"
                style={{ fontSize: "3.5rem" }}
              ></i>
            </div>
            <h5 className="fw-bold text-dark">No pending results</h5>
            <p className="text-muted mb-0 mx-auto" style={{ maxWidth: "480px" }}>
              There are no teacher-submitted results waiting for approval for the selected filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-success bg-opacity-10">
                  <tr>
                    <th className="px-3 py-3 border-0 text-success">#</th>
                    <th className="py-3 border-0 text-success">Assessment</th>
                    <th className="py-3 border-0 text-success">Subject</th>
                    <th className="py-3 border-0 text-success">Class</th>
                    <th className="py-3 border-0 text-success">Term</th>
                    <th className="py-3 border-0 text-success">Year</th>
                    <th className="py-3 border-0 text-success">Submitted By</th>
                    <th className="py-3 border-0 text-success">Status</th>
                    <th className="text-end px-3 py-3 border-0 text-success">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission, index) => {
                    const assessment = submission?.assessment || {};
                    return (
                      <tr key={submission.id} className="border-top">
                        <td className="px-3 fw-medium text-muted">{index + 1}</td>
                        <td>
                          <div className="fw-semibold text-dark">
                            {submission?.assessment_name ||
                              assessment?.name ||
                              `Assessment #${assessment?.id || submission.id}`}
                          </div>
                        </td>
                        <td className="text-dark">
                          {assessment?.subject_name || submission?.subject_name || "—"}
                        </td>
                        <td className="text-dark">
                          {assessment?.classroom_name || submission?.classroom_name || "—"}
                        </td>
                        <td className="text-dark">
                          {assessment?.term || submission?.term || "—"}
                        </td>
                        <td className="text-dark">
                          {assessment?.academic_year || submission?.academic_year || "—"}
                        </td>
                        <td className="text-dark">
                          {submission?.submitted_by_name || "—"}
                        </td>
                        <td>
                          <StatusBadge status={submission.approval_status} />
                        </td>
                        <td className="text-end px-3">
                          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-end">
                            <button
                              type="button"
                              className="btn btn-info text-white btn-sm px-3 shadow-sm"
                              onClick={() => openSubmission(submission)}
                            >
                              <i className="bi bi-eye me-1"></i> Review
                            </button>
                            <button
                              type="button"
                              className="btn btn-success btn-sm px-3 shadow-sm"
                              onClick={() => approveSubmission(submission)}
                              disabled={processing}
                            >
                              <i className="bi bi-check-lg me-1"></i> Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm px-3 shadow-sm"
                              onClick={() => returnSubmission(submission)}
                              disabled={processing}
                            >
                              <i className="bi bi-arrow-return-left me-1"></i> Return
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {selectedSubmission && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered mx-2 mx-lg-3">
            <div className="modal-content rounded-4 shadow-lg border-0">
              {/* MODAL HEADER */}
              <div className="modal-header border-bottom bg-success bg-opacity-10 px-4 py-3">
                <div>
                  <h5 className="modal-title fw-bold text-dark">Review Submitted Results</h5>
                  <small className="text-muted">
                    {selectedSubmission?.assessment_name || "Assessment"}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeSubmission}
                  disabled={processing}
                ></button>
              </div>

              {/* MODAL BODY */}
              <div className="modal-body p-4 p-md-5">
                {/* ASSESSMENT INFORMATION */}
                <div className="row g-4 mb-5">
                  <div className="col-sm-6 col-md-3">
                    <div className="border border-success border-opacity-25 rounded-3 p-4 h-100 bg-success bg-opacity-10">
                      <small className="text-muted d-block mb-2">Assessment</small>
                      <strong className="text-dark">
                        {selectedSubmission?.assessment_name || "—"}
                      </strong>
                    </div>
                  </div>
                  <div className="col-sm-6 col-md-3">
                    <div className="border border-success border-opacity-25 rounded-3 p-4 h-100 bg-success bg-opacity-10">
                      <small className="text-muted d-block mb-2">Subject</small>
                      <strong className="text-dark">
                        {selectedSubmission?.assessment?.subject_name ||
                          selectedSubmission?.subject_name ||
                          "—"}
                      </strong>
                    </div>
                  </div>
                  <div className="col-sm-6 col-md-3">
                    <div className="border border-success border-opacity-25 rounded-3 p-4 h-100 bg-success bg-opacity-10">
                      <small className="text-muted d-block mb-2">Classroom</small>
                      <strong className="text-dark">
                        {selectedSubmission?.assessment?.classroom_name ||
                          selectedSubmission?.classroom_name ||
                          "—"}
                      </strong>
                    </div>
                  </div>
                  <div className="col-sm-6 col-md-3">
                    <div className="border border-success border-opacity-25 rounded-3 p-4 h-100 bg-success bg-opacity-10">
                      <small className="text-muted d-block mb-2">Status</small>
                      <StatusBadge status={selectedSubmission.approval_status} />
                    </div>
                  </div>
                </div>

                {/* SUMMARY */}
                {!loadingResults && (
                  <div className="row g-3 mb-5">
                    <div className="col-6 col-sm-4 col-md">
                      <div className="card bg-light border-0 rounded-3 shadow-sm h-100">
                        <div className="card-body text-center p-3">
                          <small className="text-muted d-block mb-1">Total</small>
                          <h4 className="fw-bold mb-0 text-dark">{summary.total}</h4>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-4 col-md">
                      <div className="card bg-success bg-opacity-10 border-0 rounded-3 shadow-sm h-100">
                        <div className="card-body text-center p-3">
                          <small className="text-success d-block mb-1">Present</small>
                          <h4 className="fw-bold mb-0 text-success">{summary.present}</h4>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-4 col-md">
                      <div className="card bg-danger bg-opacity-10 border-0 rounded-3 shadow-sm h-100">
                        <div className="card-body text-center p-3">
                          <small className="text-danger d-block mb-1">Absent</small>
                          <h4 className="fw-bold mb-0 text-danger">{summary.absent}</h4>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-4 col-md">
                      <div className="card bg-warning bg-opacity-10 border-0 rounded-3 shadow-sm h-100">
                        <div className="card-body text-center p-3">
                          <small className="text-warning d-block mb-1">Excused</small>
                          <h4 className="fw-bold mb-0 text-warning">{summary.excused}</h4>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-4 col-md">
                      <div className="card bg-info bg-opacity-10 border-0 rounded-3 shadow-sm h-100">
                        <div className="card-body text-center p-3">
                          <small className="text-info d-block mb-1">Exempted</small>
                          <h4 className="fw-bold mb-0 text-info">{summary.exempted}</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RESULTS TABLE */}
                {loadingResults ? (
                  <Spinner />
                ) : selectedResults.length === 0 ? (
                  <div className="alert alert-warning rounded-3 border-0 p-4">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    No student results were found for this submission.
                  </div>
                ) : (
                  <div className="table-responsive rounded-3 border shadow-sm">
                    <table className="table table-bordered table-hover align-middle mb-0">
                      <thead className="bg-success bg-opacity-10">
                        <tr>
                          <th className="border-0 text-success px-3 py-3">#</th>
                          <th className="border-0 text-success py-3">Student</th>
                          <th className="border-0 text-success py-3">Status</th>
                          <th className="border-0 text-success py-3">Marks</th>
                          <th className="border-0 text-success py-3">Grade</th>
                          <th className="border-0 text-success py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResults.map((result, index) => (
                          <tr key={result.id} className="border-top">
                            <td className="fw-medium text-muted px-3">{index + 1}</td>
                            <td>
                              <strong className="text-dark">
                                {getStudentName(result)}
                              </strong>
                            </td>
                            <td>
                              <StatusBadge status={result.status} />
                            </td>
                            <td className="fw-semibold text-dark">
                              {result.marks !== null && result.marks !== undefined
                                ? result.marks
                                : "—"}
                            </td>
                            <td className="text-dark">
                              {result.grade_name || result.grade?.level || "—"}
                            </td>
                            <td className="text-muted">{result.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="modal-footer border-top bg-success bg-opacity-10 p-3 d-flex flex-column flex-sm-row gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2 shadow-sm"
                  onClick={closeSubmission}
                  disabled={processing}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4 py-2 shadow-sm"
                  onClick={() => returnSubmission(selectedSubmission)}
                  disabled={processing || loadingResults}
                >
                  <i className="bi bi-arrow-return-left me-2"></i> Return Results
                </button>
                <button
                  type="button"
                  className="btn btn-success px-4 py-2 shadow-sm"
                  onClick={() => approveSubmission(selectedSubmission)}
                  disabled={processing || loadingResults}
                >
                  {processing ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i> Approve Results
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicCoordinatorResults;