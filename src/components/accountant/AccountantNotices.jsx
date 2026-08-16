import React, { useState, useEffect, useCallback } from "react";
import {
  useSearchParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center h-60">
    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600"></div>
  </div>
);

const ButtonSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
);

// =====================================================
// FORMAT MONEY
// =====================================================

const formatMoney = (amount) => {
  return `KSh ${Number(amount || 0).toLocaleString()}`;
};

// =====================================================
// NORMALIZE STUDENT
// =====================================================

const normalizeStudent = (data, fallback = {}) => {
  const studentId =
    data?.id ||
    data?.student_id ||
    data?.student?.id ||
    fallback?.student_id ||
    fallback?.id ||
    null;

  const studentName =
    data?.student_name ||
    data?.name ||
    data?.student?.name ||
    `${data?.first_name || ""} ${data?.last_name || ""}`.trim() ||
    fallback?.student_name ||
    "Unknown Student";

  const admissionNumber =
    data?.admission_number ||
    data?.admission_no ||
    data?.student?.admission_number ||
    data?.student?.admission_no ||
    fallback?.admission_number ||
    "";

  const className =
    data?.class_name ||
    data?.classroom_name ||
    data?.classroom?.name ||
    data?.classroom ||
    fallback?.class_name ||
    "—";

  const totalExpected = Number(
    data?.total_expected ??
      data?.total_fee ??
      fallback?.total_expected ??
      0
  );

  const amountPaid = Number(
    data?.amount_paid ??
      data?.total_paid ??
      fallback?.amount_paid ??
      0
  );

  const balance = Number(
    data?.balance ??
      data?.outstanding_balance ??
      fallback?.balance ??
      Math.max(totalExpected - amountPaid, 0)
  );

  return {
    ...fallback,
    ...data,

    id: studentId,
    student_id: studentId,

    student_name: studentName,
    admission_number: admissionNumber,
    class_name: className,

    total_expected: totalExpected,
    amount_paid: amountPaid,
    balance: balance,

    term:
      data?.term ||
      data?.academic_term ||
      fallback?.term ||
      "",

    is_overdue: Boolean(
      data?.is_overdue ??
        data?.overdue ??
        fallback?.is_overdue ??
        false
    ),
  };
};

// =====================================================
// ACCOUNTANT NOTICE
// =====================================================

const AccountantNotice = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const studentId = searchParams.get("student_id");
  const admissionNumber = searchParams.get("admission_number");

  const navigationStudent = location.state?.student;

  const [student, setStudent] = useState(
    navigationStudent
      ? normalizeStudent(navigationStudent)
      : null
  );

  const [loadingStudent, setLoadingStudent] = useState(false);

  const [parent, setParent] = useState(null);
  const [loadingParent, setLoadingParent] = useState(false);

  const [sendMode, setSendMode] = useState(
    studentId || admissionNumber ? "single" : "all"
  );

  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // FIND STUDENT
  // =====================================================

  const findStudent = useCallback(async () => {
    if (!studentId && !admissionNumber) {
      return;
    }

    /*
     * If PendingFees already gave us a real ID,
     * try that first.
     */

    if (studentId) {
      try {
        setLoadingStudent(true);

        const response = await api.get(
          `students/${studentId}/`
        );

        const data = response.data;

        setStudent(
          normalizeStudent(data, navigationStudent || {})
        );

        return;
      } catch (err) {
        console.warn(
          "Could not load student by ID:",
          err.response?.data || err.message
        );
      } finally {
        setLoadingStudent(false);
      }
    }

    /*
     * IMPORTANT:
     * The pending-fees endpoint may not return student_id.
     *
     * In that case use admission number.
     */

    if (admissionNumber) {
      try {
        setLoadingStudent(true);
        setError("");

        console.log(
          "Looking up student using admission number:",
          admissionNumber
        );

        /*
         * First try Django REST filtering.
         */

        const response = await api.get(
          `students/?admission_no=${encodeURIComponent(
            admissionNumber
          )}`
        );

        const data = response.data;

        const students = Array.isArray(data)
          ? data
          : data?.results || [];

        /*
         * Find exact admission number match.
         */

        const matchedStudent = students.find(
          (item) =>
            String(
              item.admission_number ||
                item.admission_no ||
                ""
            ).toLowerCase() ===
            String(admissionNumber).toLowerCase()
        );

        if (!matchedStudent) {
          throw new Error(
            `Student with admission number ${admissionNumber} was not found.`
          );
        }

        const normalized = normalizeStudent(
          matchedStudent,
          navigationStudent || {}
        );

        console.log(
          "Student found:",
          normalized
        );

        setStudent(normalized);
      } catch (err) {
        console.error(
          "Failed to find student by admission number:",
          err.response?.data || err.message
        );

        /*
         * If the API does not support filtering,
         * try loading the whole student list.
         */

        try {
          const response = await api.get("students/");

          const data = response.data;

          const students = Array.isArray(data)
            ? data
            : data?.results || [];

          const matchedStudent = students.find(
            (item) =>
              String(
                item.admission_number ||
                  item.admission_no ||
                  ""
              ).toLowerCase() ===
              String(admissionNumber).toLowerCase()
          );

          if (!matchedStudent) {
            setError(
              `Could not find student with Admission No. ${admissionNumber}.`
            );

            return;
          }

          const normalized = normalizeStudent(
            matchedStudent,
            navigationStudent || {}
          );

          setStudent(normalized);
        } catch (fallbackErr) {
          console.error(
            "Fallback student lookup failed:",
            fallbackErr.response?.data ||
              fallbackErr.message
          );

          setError(
            `Could not load student ${admissionNumber}.`
          );
        }
      } finally {
        setLoadingStudent(false);
      }
    }
  }, [
    studentId,
    admissionNumber,
    navigationStudent,
  ]);

  // =====================================================
  // LOAD STUDENT
  // =====================================================

  useEffect(() => {
    findStudent();
  }, [findStudent]);

  // =====================================================
  // FIND PARENT
  // =====================================================

  useEffect(() => {
    if (!student?.id && !student?.student_id) {
      return;
    }

    const currentStudentId =
      student.id || student.student_id;

    const fetchParent = async () => {
      try {
        setLoadingParent(true);

        /*
         * IMPORTANT:
         * Parents are under the accounts app.
         */

        const response = await api.get(
          "accounts/parents/"
        );

        const parentList = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

        console.log(
          "Available parent records:",
          parentList
        );

        let matchedParent = null;

        // =================================================
        // METHOD 1: student_id
        // =================================================

        matchedParent = parentList.find(
          (p) =>
            String(p.student_id) ===
            String(currentStudentId)
        );

        // =================================================
        // METHOD 2: student_ids
        // =================================================

        if (!matchedParent) {
          matchedParent = parentList.find((p) =>
            Array.isArray(p.student_ids) &&
            p.student_ids.some(
              (id) =>
                String(id) ===
                String(currentStudentId)
            )
          );
        }

        // =================================================
        // METHOD 3: children
        // =================================================

        if (!matchedParent) {
          matchedParent = parentList.find((p) => {
            const children =
              p.children ||
              p.students ||
              [];

            return (
              Array.isArray(children) &&
              children.some(
                (child) =>
                  String(
                    child.id ||
                      child.student_id
                  ) ===
                  String(currentStudentId)
              )
            );
          });
        }

        // =================================================
        // METHOD 4: student relation
        // =================================================

        if (!matchedParent) {
          matchedParent = parentList.find(
            (p) => {
              const child =
                p.student ||
                p.child;

              return (
                child &&
                String(
                  child.id ||
                    child.student_id
                ) ===
                String(currentStudentId)
              );
            }
          );
        }

        // =================================================
        // METHOD 5: admission number
        // =================================================

        if (!matchedParent) {
          matchedParent = parentList.find(
            (p) => {
              const parentAdmission =
                p.admission_number ||
                p.admission_no ||
                p.student_admission_number;

              return (
                parentAdmission &&
                String(parentAdmission) ===
                  String(
                    student.admission_number
                  )
              );
            }
          );
        }

        // =================================================
        // NO PARENT
        // =================================================

        if (!matchedParent) {
          setParent(null);

          setError(
            "⚠️ No parent is linked to this student. Please link a parent first."
          );

          return;
        }

        console.log(
          "Matched parent:",
          matchedParent
        );

        setParent(matchedParent);

        /*
         * Parent was found.
         * Remove old parent error.
         */

        setError("");
      } catch (err) {
        console.error(
          "Failed to find parent:",
          err.response?.data ||
            err.message
        );

        setParent(null);

        setError(
          "Could not determine the parent for this student."
        );
      } finally {
        setLoadingParent(false);
      }
    };

    fetchParent();
  }, [student]);

  // =====================================================
  // AUTO-FILL MESSAGE
  // =====================================================

  useEffect(() => {
    if (
      sendMode !== "single" ||
      !student
    ) {
      return;
    }

    const studentName =
      student.student_name ||
      student.name ||
      "Student";

    const balance = Number(
      student.balance || 0
    );

    const term =
      student.term ||
      "the current term";

    setFormData({
      title: `Fee Reminder - ${studentName}`,

      message: `Dear Parent,

This is a reminder that ${studentName} has an outstanding school fee balance of ${formatMoney(
        balance
      )} for ${term}.

Please clear the outstanding balance at your earliest convenience.

Thank you,
Luma 2000 Academy`,
    });
  }, [student, sendMode]);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  };

  // =====================================================
  // CHANGE MODE
  // =====================================================

  const handleModeChange = (mode) => {
    setSendMode(mode);

    setSuccess("");
    setError("");

    if (
      mode === "single" &&
      student
    ) {
      const studentName =
        student.student_name ||
        student.name ||
        "Student";

      const balance = Number(
        student.balance || 0
      );

      const term =
        student.term ||
        "the current term";

      setFormData({
        title: `Fee Reminder - ${studentName}`,

        message: `Dear Parent,

This is a reminder that ${studentName} has an outstanding school fee balance of ${formatMoney(
          balance
        )} for ${term}.

Please clear the outstanding balance at your earliest convenience.

Thank you,
Luma 2000 Academy`,
      });
    } else {
      setFormData({
        title: "",
        message: "",
      });
    }
  };

  // =====================================================
  // RESET
  // =====================================================

  const handleReset = () => {
    setSuccess("");
    setError("");

    if (
      sendMode === "single" &&
      student
    ) {
      const studentName =
        student.student_name ||
        "Student";

      const balance = Number(
        student.balance || 0
      );

      const term =
        student.term ||
        "the current term";

      setFormData({
        title: `Fee Reminder - ${studentName}`,

        message: `Dear Parent,

This is a reminder that ${studentName} has an outstanding school fee balance of ${formatMoney(
          balance
        )} for ${term}.

Please clear the outstanding balance at your earliest convenience.

Thank you,
Luma 2000 Academy`,
      });
    } else {
      setFormData({
        title: "",
        message: "",
      });
    }
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccess("");
    setError("");

    if (
      !formData.title.trim() ||
      !formData.message.trim()
    ) {
      setError(
        "Title and message are required."
      );

      return;
    }

    if (sendMode === "single") {
      if (!student) {
        setError(
          "Student information is not available."
        );

        return;
      }

      if (!parent) {
        setError(
          "❌ No parent is linked to this student. Cannot send reminder."
        );

        return;
      }

      const parentUserId =
        parent.parent_user_id ||
        parent.user_id ||
        parent.user?.id ||
        parent.user ||
        parent.id;

      if (!parentUserId) {
        setError(
          "❌ The linked parent does not have a valid user account ID."
        );

        return;
      }
    }

    try {
      setSubmitting(true);

      const parentUserId =
        parent?.parent_user_id ||
        parent?.user_id ||
        parent?.user?.id ||
        parent?.user ||
        parent?.id;

      const payload = {
        title: formData.title.trim(),

        message:
          formData.message.trim(),

        priority: "Normal",

        target: "Parents",

        recipient:
          sendMode === "single"
            ? parentUserId
            : null,
      };

      console.log(
        "📤 Sending announcement:",
        payload
      );

      const response = await api.post(
        "anouncements/",
        payload
      );

      console.log(
        "✅ Announcement response:",
        response.data
      );

      if (
        response.status === 200 ||
        response.status === 201
      ) {
        setSuccess(
          sendMode === "single"
            ? `✅ Fee reminder sent successfully to the parent of ${
                student?.student_name ||
                "the student"
              }.`
            : "✅ Announcement broadcasted to all parents successfully!"
        );
      }
    } catch (err) {
      console.error(
        "❌ Send failed:",
        err.response?.data ||
          err.message
      );

      const responseData =
        err.response?.data;

      if (
        typeof responseData ===
        "string"
      ) {
        setError(responseData);
      } else if (
        responseData?.detail
      ) {
        setError(
          responseData.detail
        );
      } else if (
        responseData?.message
      ) {
        setError(
          responseData.message
        );
      } else {
        setError(
          "❌ Failed to send announcement. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (
    loadingStudent ||
    loadingParent
  ) {
    return <Spinner />;
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}

      <div className="card">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Send Fee Announcement
        </h1>

        <p className="text-gray-500 mt-2 text-sm">
          Send targeted fee reminders or
          broadcast financial notices to
          parents.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-lg">
          <p className="font-semibold">
            Notice Error
          </p>

          <p className="mt-1 text-sm break-words">
            {error}
          </p>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 sm:p-4 rounded-lg">
          <p className="font-semibold">
            Success
          </p>

          <p className="mt-1 text-sm">
            {success}
          </p>
        </div>
      )}

      {/* FORM */}

      <div className="card max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 md:space-y-6"
        >

          {/* NOTIFICATION TYPE */}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Notification Type
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

              {/* SINGLE */}

              <label
                className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition ${
                  sendMode === "single"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <div className="flex gap-3">

                  <input
                    type="radio"
                    name="sendMode"
                    checked={
                      sendMode ===
                      "single"
                    }
                    onChange={() =>
                      handleModeChange(
                        "single"
                      )
                    }
                    disabled={
                      !studentId &&
                      !admissionNumber
                    }
                  />

                  <div>
                    <p className="font-semibold text-gray-800">
                      Targeted Parent Notice
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Send the notice only
                      to the parent connected
                      to a specific student.
                    </p>
                  </div>

                </div>
              </label>

              {/* ALL */}

              <label
                className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition ${
                  sendMode === "all"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <div className="flex gap-3">

                  <input
                    type="radio"
                    name="sendMode"
                    checked={
                      sendMode === "all"
                    }
                    onChange={() =>
                      handleModeChange(
                        "all"
                      )
                    }
                  />

                  <div>
                    <p className="font-semibold text-gray-800">
                      Broadcast All Parents
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Send the announcement
                      to every user with the
                      Parent role.
                    </p>
                  </div>

                </div>
              </label>

            </div>
          </div>

          {/* TARGETED STUDENT */}

          {sendMode === "single" && (
            <div className="space-y-4">

              {!student ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">

                  <p className="font-semibold text-yellow-800">
                    No student selected
                  </p>

                  <p className="text-sm text-yellow-700 mt-1">
                    Open this page using
                    the Send Reminder button
                    from Pending Fees.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/accountant/pending-fees"
                      )
                    }
                    className="mt-3 w-full sm:w-auto px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                  >
                    Go to Pending Fees
                  </button>

                </div>
              ) : (
                <>
                  {/* STUDENT */}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">

                    <p className="text-sm text-blue-700 font-medium">
                      Selected Student
                    </p>

                    <p className="text-lg font-bold text-blue-900 mt-1">
                      {student.student_name ||
                        "—"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-sm">

                      <div>
                        <p className="text-gray-500">
                          Admission No.
                        </p>

                        <p className="font-semibold">
                          {student.admission_number ||
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Class
                        </p>

                        <p className="font-semibold">
                          {student.class_name ||
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Outstanding Balance
                        </p>

                        <p className="font-bold text-red-600">
                          {formatMoney(
                            student.balance
                          )}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* PARENT */}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">

                    <p className="text-sm text-green-700 font-medium">
                      Automatically Linked Parent
                    </p>

                    {parent ? (
                      <>
                        <p className="text-lg font-bold text-green-900 mt-1">
                          {parent.parent_name ||
                            parent.name ||
                            parent.user?.first_name ||
                            "Parent"}
                        </p>

                        {parent.parent_phone && (
                          <p className="text-sm text-green-700 mt-1">
                            Phone:{" "}
                            {
                              parent.parent_phone
                            }
                          </p>
                        )}

                        <p className="text-xs text-green-600 mt-2">
                          Parent successfully
                          linked to this student.
                        </p>
                      </>
                    ) : (
                      <p className="text-red-600 mt-2">
                        No parent is linked
                        to this student.
                      </p>
                    )}

                  </div>
                </>
              )}

            </div>
          )}

          {/* BROADCAST */}

          {sendMode === "all" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-800">
                Broadcast to All Parents
              </p>

              <p className="text-sm text-blue-700 mt-1">
                This message will be sent
                to all users whose account
                role is <strong>PARENT</strong>.
              </p>
            </div>
          )}

          {/* TITLE */}

          <div>
            <label className="form-label">
              Title *
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={
                sendMode === "single"
                  ? "Fee Reminder - Student Name"
                  : "Example: Important Fee Announcement"
              }
              className="milk-input w-full"
              required
            />
          </div>

          {/* MESSAGE */}

          <div>
            <label className="form-label">
              Message Content *
            </label>

            <textarea
              name="message"
              rows="9"
              value={formData.message}
              onChange={handleChange}
              placeholder={
                sendMode === "single"
                  ? "Dear Parent, kindly clear the outstanding fee..."
                  : "Dear Parents, ..."
              }
              className="milk-input w-full resize-none"
              required
            />
          </div>

          {/* BUTTONS */}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                (sendMode === "single" &&
                  (!student ||
                    !parent))
              }
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && (
                <ButtonSpinner />
              )}

              {submitting
                ? "Sending..."
                : sendMode === "single"
                ? "Send Fee Reminder"
                : "Broadcast to All Parents"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default AccountantNotice;