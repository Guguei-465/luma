import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/api";
import FeedbackAlert from "../ui/FeedbackAlert";

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
  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
);

// =====================================================
// SAFE ARRAY
// =====================================================

const getArray = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

// =====================================================
// FIRST VALID VALUE
// =====================================================

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return null;
};

// =====================================================
// MONEY FORMAT
// =====================================================

const formatMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "KSh 0";
  }

  return `KSh ${number.toLocaleString("en-KE")}`;
};

// =====================================================
// STUDENT NAME
// =====================================================

const getStudentName = (student) => {
  if (!student) return "Unknown Student";

  return (
    firstValue(
      student.student_name,
      student.full_name,
      student.name,
      student.student_full_name,

      student.first_name && student.last_name
        ? `${student.first_name} ${student.last_name}`
        : null,

      student.first_name,
      student.last_name
    ) || "Unknown Student"
  );
};

// =====================================================
// STUDENT ID
// =====================================================

const getStudentId = (student) => {
  if (!student) return null;

  return (
    student.id ??
    student.student_id ??
    student.student?.id ??
    null
  );
};

// =====================================================
// ADMISSION NUMBER
// =====================================================

const getAdmissionNumber = (student) => {
  if (!student) return "—";

  const admission = firstValue(
    student.admission_number,
    student.admission_no,
    student.admission,
    student.student_admission_number,

    student.student?.admission_number,
    student.student?.admission_no,

    student.profile?.admission_number,
    student.profile?.admission_no
  );

  return admission || "—";
};

// =====================================================
// CLASSROOM NAME
// =====================================================

const getClassroomName = (student) => {
  if (!student) return "—";

  const classroom =
    typeof student.classroom === "object"
      ? student.classroom
      : null;

  const classroomName = firstValue(
    // Direct fields
    student.classroom_name,
    student.class_name,
    student.grade_name,

    // classroom can be an object
    classroom?.name,
    classroom?.class_name,
    classroom?.classroom_name,
    classroom?.grade_name,

    // classroom can sometimes be a string
    typeof student.classroom === "string"
      ? student.classroom
      : null,

    // Nested student
    student.student?.classroom_name,
    student.student?.class_name,

    typeof student.student?.classroom === "string"
      ? student.student.classroom
      : null,

    student.student?.classroom?.name,
    student.student?.classroom?.class_name
  );

  return classroomName || "—";
};

// =====================================================
// BUILD STUDENT LOOKUP
// =====================================================

const buildStudentLookup = (students) => {
  const lookup = {};

  students.forEach((student) => {
    const id = getStudentId(student);

    if (!id) return;

    lookup[String(id)] = {
      ...student,

      student_name: getStudentName(student),
      admission_number: getAdmissionNumber(student),
      class_name: getClassroomName(student),
    };
  });

  return lookup;
};

// =====================================================
// NORMALIZE PENDING FEE
// =====================================================

const mapPendingFee = (fee, studentLookup) => {
  // ---------------------------------------------------
  // STUDENT ID
  // ---------------------------------------------------

  const studentId =
    fee?.student_id ??
    (typeof fee?.student === "number"
      ? fee.student
      : fee?.student?.id) ??
    null;

  // ---------------------------------------------------
  // STUDENT FROM LOOKUP
  // ---------------------------------------------------

  const lookedUpStudent =
    studentId !== null
      ? studentLookup[String(studentId)]
      : null;

  // ---------------------------------------------------
  // STUDENT OBJECT FROM FEE
  // ---------------------------------------------------

  const feeStudent =
    fee?.student &&
    typeof fee.student === "object"
      ? fee.student
      : null;

  // ---------------------------------------------------
  // STUDENT NAME
  // ---------------------------------------------------

  const studentName =
    firstValue(
      fee?.student_name,

      feeStudent?.student_name,
      feeStudent?.full_name,
      feeStudent?.name,

      lookedUpStudent?.student_name,

      lookedUpStudent?.full_name,
      lookedUpStudent?.name
    ) || "Unknown Student";

  // ---------------------------------------------------
  // ADMISSION NUMBER
  //
  // IMPORTANT:
  // The fee API can return:
  //
  // admission_number: ""
  // student: 7
  //
  // So we deliberately DO NOT stop at the empty
  // admission_number. We look at the student endpoint.
  // ---------------------------------------------------

  const admissionNumber =
    firstValue(
      // Fee endpoint
      fee?.admission_number,
      fee?.admission_no,

      // Nested student
      feeStudent?.admission_number,
      feeStudent?.admission_no,

      // Student endpoint lookup
      lookedUpStudent?.admission_number,
      lookedUpStudent?.admission_no
    ) || "—";

  // ---------------------------------------------------
  // CLASSROOM
  //
  // IMPORTANT:
  // Your API gives:
  //
  // classroom: "Grade 1 A"
  //
  // So classroom itself MUST be checked.
  // ---------------------------------------------------

  const classroomFromFee =
    typeof fee?.classroom === "object"
      ? fee.classroom
      : null;

  const classroomName =
    firstValue(
      // Direct fee fields
      fee?.class_name,
      fee?.classroom_name,

      // YOUR API FIELD
      typeof fee?.classroom === "string"
        ? fee.classroom
        : null,

      // classroom object
      classroomFromFee?.name,
      classroomFromFee?.class_name,
      classroomFromFee?.classroom_name,

      // Nested student
      feeStudent?.class_name,
      feeStudent?.classroom_name,

      typeof feeStudent?.classroom === "string"
        ? feeStudent.classroom
        : null,

      // Student lookup
      lookedUpStudent?.class_name,
      lookedUpStudent?.classroom_name
    ) || "—";

  // ---------------------------------------------------
  // TOTAL EXPECTED
  // ---------------------------------------------------

  const totalExpected = Number(
    firstValue(
      fee?.total_expected,
      fee?.total_fee,
      fee?.amount,

      fee?.fee_structure?.amount,

      0
    )
  );

  // ---------------------------------------------------
  // AMOUNT PAID
  // ---------------------------------------------------

  const amountPaid = Number(
    firstValue(
      fee?.amount_paid,
      fee?.paid_amount,
      fee?.amount_received,

      0
    )
  );

  // ---------------------------------------------------
  // BALANCE
  // ---------------------------------------------------

  let balance = Number(
    firstValue(
      fee?.balance,
      fee?.balance_due,
      fee?.outstanding_balance,

      Math.max(
        totalExpected - amountPaid,
        0
      )
    )
  );

  if (!Number.isFinite(balance)) {
    balance = Math.max(
      totalExpected - amountPaid,
      0
    );
  }

  // ---------------------------------------------------
  // STATUS
  // ---------------------------------------------------

  let status = "unpaid";

  if (amountPaid <= 0) {
    status = "unpaid";
  } else if (
    totalExpected > 0 &&
    amountPaid >= totalExpected
  ) {
    status = "paid";
  } else if (amountPaid > 0) {
    status = "partial";
  }

  // ---------------------------------------------------
  // TERM
  // ---------------------------------------------------

  const term =
    firstValue(
      fee?.term,
      fee?.academic_term
    ) || "—";

  // ---------------------------------------------------
  // ACADEMIC YEAR
  // ---------------------------------------------------

  const academicYear =
    firstValue(
      fee?.academic_year
    ) || "—";

  // ---------------------------------------------------
  // OVERDUE
  // ---------------------------------------------------

  const isOverdue =
    Boolean(fee?.is_overdue);

  // ---------------------------------------------------
  // RETURN NORMALIZED OBJECT
  // ---------------------------------------------------

  return {
    ...fee,

    id: fee?.id,

    student_id: studentId,

    student_name: studentName,

    admission_number: admissionNumber,

    class_name: classroomName,

    classroom: classroomName,

    total_expected: Number.isFinite(
      totalExpected
    )
      ? totalExpected
      : 0,

    total_fee: Number.isFinite(
      Number(fee?.total_fee)
    )
      ? Number(fee.total_fee)
      : totalExpected,

    amount_paid: Number.isFinite(
      amountPaid
    )
      ? amountPaid
      : 0,

    balance: Number.isFinite(balance)
      ? balance
      : 0,

    status,

    term,

    academic_year: academicYear,

    is_overdue: isOverdue,
  };
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({ status }) => {
  const styles = {
    unpaid:
      "bg-orange-100 text-orange-700 border border-orange-200",

    partial:
      "bg-yellow-100 text-yellow-700 border border-yellow-200",

    paid:
      "bg-green-100 text-green-700 border border-green-200",

    overdue:
      "bg-red-100 text-red-700 border border-red-200",
  };

  const labels = {
    unpaid: "UNPAID",
    partial: "PARTIAL",
    paid: "PAID",
    overdue: "OVERDUE",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
        styles[status] ||
        "bg-gray-100 text-gray-700 border border-gray-200"
      }`}
    >
      {labels[status] ||
        String(
          status || "UNKNOWN"
        ).toUpperCase()}
    </span>
  );
};

// =====================================================
// COMPONENT
// =====================================================

const PendingFees = () => {
  const [fees, setFees] = useState([]);

  const [filteredFees, setFilteredFees] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [filterClass, setFilterClass] =
    useState("");

  // ===================================================
  // FETCH DATA
  // ===================================================

  const fetchPendingFees = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        // ------------------------------------------------
        // IMPORTANT:
        // Fetch both:
        //
        // 1. Student fees
        // 2. Students
        //
        // Student fees contains:
        // student: 7
        //
        // Students endpoint contains:
        // admission_number
        // classroom
        // ------------------------------------------------

        const [
          studentFeesResponse,
          studentsResponse,
        ] = await Promise.all([
          api.get("fees/student-fees/"),
          api.get("students/"),
        ]);

        console.log(
          "================================="
        );

        console.log(
          "STUDENT FEES API RESPONSE:",
          studentFeesResponse.data
        );

        console.log(
          "STUDENTS API RESPONSE:",
          studentsResponse.data
        );

        console.log(
          "================================="
        );

        const rawFees =
          getArray(
            studentFeesResponse.data
          );

        const students =
          getArray(
            studentsResponse.data
          );

        console.log(
          "RAW STUDENT FEES COUNT:",
          rawFees.length
        );

        console.log(
          "STUDENT COUNT:",
          students.length
        );

        // ------------------------------------------------
        // BUILD LOOKUP
        // ------------------------------------------------

        const studentLookup =
          buildStudentLookup(
            students
          );

        console.log(
          "STUDENT LOOKUP:",
          studentLookup
        );

        // ------------------------------------------------
        // MAP FEES
        // ------------------------------------------------

        const mappedFees =
          rawFees
            .map((fee) =>
              mapPendingFee(
                fee,
                studentLookup
              )
            )
            // Only show students with a balance
            .filter(
              (fee) =>
                Number(
                  fee.balance
                ) > 0
            );

        console.log(
          "================================="
        );

        console.log(
          "MAPPED PENDING FEES:",
          mappedFees
        );

        console.log(
          "================================="
        );

        // ------------------------------------------------
        // DEBUG EACH STUDENT
        // ------------------------------------------------

        mappedFees.forEach(
          (fee) => {
            console.log(
              "PENDING FEE:",
              {
                id: fee.id,
                student_id:
                  fee.student_id,
                student_name:
                  fee.student_name,
                admission_number:
                  fee.admission_number,
                classroom:
                  fee.classroom,
                class_name:
                  fee.class_name,
                total_expected:
                  fee.total_expected,
                amount_paid:
                  fee.amount_paid,
                balance:
                  fee.balance,
              }
            );
          }
        );

        setFees(mappedFees);
        setFilteredFees(mappedFees);
      } catch (err) {
        console.error(
          "PENDING FEES ERROR:",
          err?.response?.data ||
            err?.message ||
            err
        );

        setError(
          "Could not load pending fee records."
        );

        setFees([]);
        setFilteredFees([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchPendingFees();
  }, [fetchPendingFees]);

  // ===================================================
  // SEARCH / FILTER
  // ===================================================

  useEffect(() => {
    let result = [...fees];

    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------

    if (searchTerm.trim()) {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      result = result.filter(
        (fee) => {
          const name =
            String(
              fee.student_name ||
                ""
            ).toLowerCase();

          const admission =
            String(
              fee.admission_number ||
                ""
            ).toLowerCase();

          const className =
            String(
              fee.class_name ||
                ""
            ).toLowerCase();

          return (
            name.includes(search) ||
            admission.includes(search) ||
            className.includes(search)
          );
        }
      );
    }

    // -------------------------------------------------
    // CLASS
    // -------------------------------------------------

    if (filterClass.trim()) {
      const classSearch =
        filterClass
          .trim()
          .toLowerCase();

      result = result.filter(
        (fee) =>
          String(
            fee.class_name ||
              ""
          )
            .toLowerCase()
            .includes(classSearch)
      );
    }

    setFilteredFees(result);
  }, [
    fees,
    searchTerm,
    filterClass,
  ]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setSuccess("");
      setError("");

      await fetchPendingFees();

      setSuccess(
        "Pending fees refreshed successfully!"
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ===================================================
  // SEND REMINDER
  // ===================================================

  const handleReminder = async (fee) => {
    if (!fee?.student_id) {
      setError(
        "This fee record is not linked to a valid student."
      );
      return;
    }

    try {
      setError("");

      /*
       * Keep your existing reminder endpoint here
       * if you already have one.
       *
       * Example:
       *
       * await api.post(
       *   "fees/send-reminder/",
       *   {
       *     student_id: fee.student_id
       *   }
       * );
       */

      setSuccess(
        `Reminder action selected for ${fee.student_name}.`
      );
    } catch (err) {
      console.error(
        "REMINDER ERROR:",
        err?.response?.data ||
          err?.message
      );

      setError(
        "Could not send fee reminder."
      );
    }
  };

  // ===================================================
  // SUMMARY
  // ===================================================

  const summary = useMemo(() => {
    const totalOutstanding =
      filteredFees.reduce(
        (sum, fee) =>
          sum +
          Number(
            fee.balance || 0
          ),
        0
      );

    const partiallyPaid =
      filteredFees.filter(
        (fee) =>
          fee.status ===
          "partial"
      ).length;

    const overdue =
      filteredFees.filter(
        (fee) =>
          fee.is_overdue
      ).length;

    return {
      totalOutstanding,
      partiallyPaid,
      overdue,
    };
  }, [filteredFees]);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return <Spinner />;
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 md:px-6 space-y-4 md:space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Pending Fees
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              View students with outstanding school fees
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="milk-btn w-full sm:w-auto whitespace-nowrap disabled:opacity-60"
          >
            {refreshing && (
              <ButtonSpinner />
            )}

            {refreshing
              ? "Refreshing..."
              : "🔄 Refresh"}
          </button>

        </div>
      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {success && (
        <FeedbackAlert
          type="success"
          message={success}
          onDismiss={() =>
            setSuccess("")
          }
        />
      )}

      {error && (
        <FeedbackAlert
          type="error"
          message={error}
          onDismiss={() =>
            setError("")
          }
        />
      )}

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="card space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* SEARCH */}

          <div>
            <label className="form-label">
              Search Student
            </label>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              placeholder="Name or Admission Number..."
              className="milk-input w-full"
            />
          </div>

          {/* CLASS */}

          <div>
            <label className="form-label">
              Class / Grade
            </label>

            <input
              type="text"
              value={filterClass}
              onChange={(e) =>
                setFilterClass(
                  e.target.value
                )
              }
              placeholder="Filter by class..."
              className="milk-input w-full"
            />
          </div>

        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

          <p className="text-sm text-gray-600">
            Showing{" "}
            <strong>
              {filteredFees.length}
            </strong>{" "}
            students with pending fees
          </p>

          {(searchTerm ||
            filterClass) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilterClass("");
              }}
              className="text-sm text-blue-600 hover:underline text-left sm:text-right"
            >
              Clear filters
            </button>
          )}

        </div>

      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">

        {/* TOTAL OUTSTANDING */}

        <div className="card border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">
            Total Outstanding Amount
          </p>

          <p className="text-xl md:text-2xl font-bold text-orange-700 mt-1">
            {formatMoney(
              summary.totalOutstanding
            )}
          </p>
        </div>

        {/* PARTIAL */}

        <div className="card border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">
            Partially Paid Students
          </p>

          <p className="text-xl md:text-2xl font-bold text-yellow-700 mt-1">
            {summary.partiallyPaid}
          </p>
        </div>

        {/* OVERDUE */}

        <div className="card border-l-4 border-red-500">
          <p className="text-sm text-gray-600">
            Overdue / Arrears
          </p>

          <p className="text-xl md:text-2xl font-bold text-red-700 mt-1">
            {summary.overdue}{" "}
            student
            {summary.overdue !== 1
              ? "s"
              : ""}
          </p>
        </div>

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="card overflow-hidden">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">

          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Student Outstanding List
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Swipe left or right to view all columns on small screens.
            </p>
          </div>

          <span className="text-sm text-gray-500 whitespace-nowrap">
            {filteredFees.length} record
            {filteredFees.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

        {filteredFees.length === 0 ? (

          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">
              💰
            </div>

            <p className="font-medium">
              No pending fee records found.
            </p>

            <p className="text-sm mt-1">
              Try changing your search or class filter.
            </p>
          </div>

        ) : (

          /*
           * IMPORTANT:
           *
           * overflow-x-auto means:
           *
           * Desktop  → normal table
           * Tablet   → table can scroll if needed
           * Mobile   → horizontal swipe
           *
           * We deliberately do NOT hide Admission No.
           * or Class on mobile.
           */

          <div className="w-full overflow-x-auto border border-gray-200 rounded-lg">

            <table className="w-full min-w-[1050px] border-collapse text-sm">

              <thead>

                <tr className="bg-gray-100">

                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">
                    Student Name
                  </th>

                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">
                    Adm No.
                  </th>

                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">
                    Class
                  </th>

                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">
                    Term
                  </th>

                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">
                    Total Expected
                  </th>

                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">
                    Amount Paid
                  </th>

                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">
                    Balance Due
                  </th>

                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">
                    Status
                  </th>

                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredFees.map(
                  (fee, index) => (

                    <tr
                      key={
                        fee.id ||
                        fee.student_id ||
                        `fee-${index}`
                      }
                      className="hover:bg-gray-50 transition"
                    >

                      {/* STUDENT */}

                      <td className="px-3 py-3 border-b whitespace-nowrap font-medium text-gray-800">
                        {fee.student_name}
                      </td>

                      {/* ADMISSION */}

                      <td className="px-3 py-3 border-b whitespace-nowrap font-medium">

                        {fee.admission_number &&
                        fee.admission_number !==
                          "—" ? (
                          <span className="text-gray-800">
                            {
                              fee.admission_number
                            }
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            —
                          </span>
                        )}

                      </td>

                      {/* CLASS */}

                      <td className="px-3 py-3 border-b whitespace-nowrap">

                        {fee.class_name &&
                        fee.class_name !==
                          "—" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                            {
                              fee.class_name
                            }
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            —
                          </span>
                        )}

                      </td>

                      {/* TERM */}

                      <td className="px-3 py-3 border-b whitespace-nowrap">
                        {fee.term}
                      </td>

                      {/* EXPECTED */}

                      <td className="px-3 py-3 border-b whitespace-nowrap">
                        {formatMoney(
                          fee.total_expected
                        )}
                      </td>

                      {/* PAID */}

                      <td className="px-3 py-3 border-b whitespace-nowrap text-green-600 font-semibold">
                        {formatMoney(
                          fee.amount_paid
                        )}
                      </td>

                      {/* BALANCE */}

                      <td className="px-3 py-3 border-b whitespace-nowrap text-red-600 font-bold">
                        {formatMoney(
                          fee.balance
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-3 py-3 border-b">
                        <StatusBadge
                          status={
                            fee.is_overdue
                              ? "overdue"
                              : fee.status
                          }
                        />
                      </td>

                      {/* ACTION */}

                      <td className="px-3 py-3 border-b">

                        <button
                          type="button"
                          onClick={() =>
                            handleReminder(
                              fee
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition"
                        >
                          <span>
                            ✉
                          </span>

                          <span>
                            Send Reminder
                          </span>
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default PendingFees;