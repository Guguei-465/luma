import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import FeedbackAlert from "../ui/FeedbackAlert";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
  </div>
);

const ButtonSpinner = () => (
  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
);

// =====================================================
// MONEY
// =====================================================

const formatMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "KSh 0";
  }

  return `KSh ${number.toLocaleString("en-KE")}`;
};

// =====================================================
// SAFE ARRAY
// =====================================================

const getArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

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
      value !== ""
    ) {
      return value;
    }
  }

  return null;
};

// =====================================================
// NORMALIZE ID
// =====================================================

const normalizeId = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return String(value);
};

// =====================================================
// STATUS
// =====================================================

const normalizeStatus = (payment) => {
  const paymentStatus = String(
    payment?.payment_status || ""
  ).toLowerCase();

  const status = String(
    payment?.status || ""
  ).toLowerCase();

  // M-PESA FAILED
  if (
    paymentStatus === "failed" ||
    status === "failed" ||
    String(payment?.result_code) === "1037"
  ) {
    return "failed";
  }

  if (
    paymentStatus === "cancelled" ||
    status === "cancelled"
  ) {
    return "cancelled";
  }

  if (
    paymentStatus === "reversed" ||
    status === "reversed"
  ) {
    return "reversed";
  }

  if (
    paymentStatus === "success" ||
    paymentStatus === "successful" ||
    paymentStatus === "paid" ||
    status === "paid" ||
    status === "success" ||
    status === "successful"
  ) {
    return "paid";
  }

  const amountPaid = Number(
    firstValue(
      payment?.amount_paid,
      payment?.amount_received,
      0
    )
  );

  const totalExpected = Number(
    firstValue(
      payment?.total_expected,
      payment?.total_fee,
      0
    )
  );

  if (
    totalExpected > 0 &&
    amountPaid >= totalExpected
  ) {
    return "paid";
  }

  if (amountPaid > 0) {
    return "partial";
  }

  return "pending";
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({ status }) => {
  const styles = {
    paid:
      "bg-green-100 text-green-700 border-green-200",

    partial:
      "bg-yellow-100 text-yellow-700 border-yellow-200",

    pending:
      "bg-orange-100 text-orange-700 border-orange-200",

    failed:
      "bg-red-100 text-red-700 border-red-200",

    cancelled:
      "bg-gray-100 text-gray-700 border-gray-200",

    reversed:
      "bg-purple-100 text-purple-700 border-purple-200",
  };

  const labels = {
    paid: "PAID",
    partial: "PARTIAL",
    pending: "PENDING",
    failed: "FAILED",
    cancelled: "CANCELLED",
    reversed: "REVERSED",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
        styles[status] ||
        "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {labels[status] ||
        String(status || "UNKNOWN").toUpperCase()}
    </span>
  );
};

// =====================================================
// STUDENT INFORMATION EXTRACTOR
// =====================================================

const getStudentInformation = (student) => {
  if (!student || typeof student !== "object") {
    return {
      id: null,
      name: null,
      admissionNumber: null,
      className: null,
    };
  }

  const classroom =
    student?.classroom &&
    typeof student.classroom === "object"
      ? student.classroom
      : null;

  const name = firstValue(
    student?.student_name,
    student?.full_name,
    student?.name,

    student?.first_name &&
      student?.last_name
      ? `${student.first_name} ${student.last_name}`
      : null
  );

  const admissionNumber = firstValue(
    student?.admission_number,
    student?.admission_no,
    student?.adm_number,
    student?.adm_no
  );

  const className = firstValue(
    student?.class_name,
    student?.classroom_name,
    student?.grade_name,

    classroom?.name,
    classroom?.class_name,
    classroom?.classroom_name,

    typeof student?.classroom === "string"
      ? student.classroom
      : null
  );

  return {
    id: student?.id || null,
    name,
    admissionNumber,
    className,
  };
};

// =====================================================
// PAYMENT MAPPER
// =====================================================

const mapPayment = (
  payment,
  studentFeeMap,
  studentMap
) => {
  // ---------------------------------------------------
  // STUDENT FEE
  // ---------------------------------------------------

  const directStudentFee =
    payment?.student_fee &&
    typeof payment.student_fee === "object"
      ? payment.student_fee
      : null;

  const studentFeeId = normalizeId(
    directStudentFee?.id ||
      payment?.student_fee
  );

  const studentFee =
    directStudentFee ||
    (studentFeeId
      ? studentFeeMap[studentFeeId]
      : null) ||
    null;

  // ---------------------------------------------------
  // STUDENT ID
  // ---------------------------------------------------

  const studentId = normalizeId(
    payment?.student_id ||
      (
        payment?.student &&
        typeof payment.student === "object"
          ? payment.student.id
          : payment?.student
      ) ||
      studentFee?.student_id ||
      (
        studentFee?.student &&
        typeof studentFee.student === "object"
          ? studentFee.student.id
          : studentFee?.student
      )
  );

  // ---------------------------------------------------
  // STUDENT OBJECT
  // ---------------------------------------------------

  const paymentStudent =
    payment?.student &&
    typeof payment.student === "object"
      ? payment.student
      : null;

  const feeStudent =
    studentFee?.student &&
    typeof studentFee.student === "object"
      ? studentFee.student
      : null;

  const student =
    paymentStudent ||
    feeStudent ||
    (studentId
      ? studentMap[studentId]
      : null) ||
    null;

  // ---------------------------------------------------
  // STUDENT INFORMATION
  // ---------------------------------------------------

  const studentInfo =
    getStudentInformation(student);

  // ---------------------------------------------------
  // STUDENT NAME
  // ---------------------------------------------------

  const studentName =
    firstValue(
      payment?.student_name,
      payment?.student_full_name,

      studentInfo.name,

      studentFee?.student_name,

      student?.student_name,
      student?.full_name,
      student?.name,

      payment?.first_name &&
        payment?.last_name
        ? `${payment.first_name} ${payment.last_name}`
        : null
    ) || "Unknown Student";

  // ---------------------------------------------------
  // ADMISSION NUMBER
  // ---------------------------------------------------

  const admissionNumber =
    firstValue(
      payment?.admission_number,
      payment?.admission_no,

      studentInfo.admissionNumber,

      studentFee?.admission_number,
      studentFee?.admission_no,

      student?.admission_number,
      student?.admission_no,
      student?.adm_number,
      student?.adm_no
    ) || "—";

  // ---------------------------------------------------
  // CLASSROOM
  // ---------------------------------------------------

  const classroomObject =
    payment?.classroom &&
    typeof payment.classroom === "object"
      ? payment.classroom
      : student?.classroom &&
        typeof student.classroom === "object"
      ? student.classroom
      : null;

  const className =
    firstValue(
      payment?.class_name,
      payment?.classroom_name,

      studentInfo.className,

      studentFee?.class_name,
      studentFee?.classroom_name,

      student?.class_name,
      student?.classroom_name,

      classroomObject?.name,
      classroomObject?.class_name,
      classroomObject?.classroom_name,

      typeof payment?.classroom === "string"
        ? payment.classroom
        : null,

      typeof student?.classroom === "string"
        ? student.classroom
        : null,

      typeof studentFee?.classroom === "string"
        ? studentFee.classroom
        : null
    ) || "—";

  // ---------------------------------------------------
  // RECEIPT
  // ---------------------------------------------------

  const receiptNumber =
    firstValue(
      payment?.receipt_number,
      payment?.receipt_no,
      payment?.receipt,
      payment?.reference,
      payment?.transaction_reference
    ) || "—";

  // ---------------------------------------------------
  // STATUS
  // ---------------------------------------------------

  const status = normalizeStatus(payment);

  // ---------------------------------------------------
  // AMOUNT
  // ---------------------------------------------------

  const amount = Number(
    firstValue(
      payment?.amount,
      payment?.amount_paid,
      0
    )
  );

  // ---------------------------------------------------
  // AMOUNT PAID
  // ---------------------------------------------------

  let amountPaid = Number(
    firstValue(
      payment?.amount_paid,
      payment?.amount_received,
      payment?.paid_amount,
      payment?.payment_amount,
      payment?.amount,
      0
    )
  );

  // Failed/cancelled/reversed payments did not actually
  // contribute to student fees.
  if (
    status === "failed" ||
    status === "cancelled" ||
    status === "reversed"
  ) {
    amountPaid = 0;
  }

  // ---------------------------------------------------
  // TOTAL EXPECTED
  // ---------------------------------------------------

  const totalExpected = Number(
    firstValue(
      payment?.total_expected,
      payment?.total_fee,
      payment?.expected_amount,
      payment?.amount_due,

      studentFee?.total_expected,
      studentFee?.total_fee,
      studentFee?.amount
    ) || 0
  );

  // ---------------------------------------------------
  // BALANCE
  // ---------------------------------------------------

  let balance;

  if (
    payment?.balance !== undefined &&
    payment?.balance !== null &&
    payment?.balance !== ""
  ) {
    balance = Number(payment.balance);
  } else {
    balance = Math.max(
      totalExpected - amountPaid,
      0
    );
  }

  if (
    status === "failed" ||
    status === "cancelled" ||
    status === "reversed"
  ) {
    balance = totalExpected;
  }

  // ---------------------------------------------------
  // TERM
  // ---------------------------------------------------

  const term =
    firstValue(
      payment?.term,
      payment?.academic_term,

      studentFee?.term
    ) || "—";

  // ---------------------------------------------------
  // ACADEMIC YEAR
  // ---------------------------------------------------

  const academicYear =
    firstValue(
      payment?.academic_year,

      studentFee?.academic_year
    ) || "";

  // ---------------------------------------------------
  // PAYMENT DATE
  // ---------------------------------------------------

  const paymentDate =
    firstValue(
      payment?.payment_date,
      payment?.date,
      payment?.created_at
    ) || null;

  // ---------------------------------------------------
  // RETURN
  // ---------------------------------------------------

  return {
    ...payment,

    student_id:
      studentId ||
      student?.id ||
      null,

    student_name:
      studentName,

    admission_number:
      admissionNumber,

    class_name:
      className,

    receipt_number:
      receiptNumber,

    amount:
      Number.isFinite(amount)
        ? amount
        : 0,

    amount_paid:
      Number.isFinite(amountPaid)
        ? amountPaid
        : 0,

    total_expected:
      Number.isFinite(totalExpected)
        ? totalExpected
        : 0,

    balance:
      Number.isFinite(balance)
        ? balance
        : 0,

    status,

    term,

    academic_year:
      academicYear,

    payment_date:
      paymentDate,
  };
};

// =====================================================
// COMPONENT
// =====================================================

const FeeRecords = () => {
  const navigate = useNavigate();

  const [payments, setPayments] =
    useState([]);

  const [filteredPayments, setFilteredPayments] =
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

  const [filterStatus, setFilterStatus] =
    useState("all");

  const [filterTerm, setFilterTerm] =
    useState("");

  const [filterClass, setFilterClass] =
    useState("");

  // ===================================================
  // FETCH PAYMENTS + STUDENT FEES + STUDENTS
  // ===================================================

  const fetchPayments = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * IMPORTANT:
         *
         * Payments alone may only contain:
         *
         * student_fee: 2
         * student_id: null
         *
         * Therefore we also load:
         *
         * 1. Student Fees
         * 2. Students
         *
         * This allows us to recover:
         *
         * Admission Number
         * Classroom
         * Student ID
         */

        const [
          paymentsResponse,
          studentFeesResponse,
          studentsResponse,
        ] = await Promise.all([
          api.get("fees/payments/"),

          api
            .get("fees/student-fees/")
            .catch(() => ({
              data: [],
            })),

          api
            .get("students/")
            .catch(() => ({
              data: [],
            })),
        ]);

        // ------------------------------------------------
        // RAW DATA
        // ------------------------------------------------

        const rawPayments =
          getArray(
            paymentsResponse.data
          );

        const studentFees =
          getArray(
            studentFeesResponse.data
          );

        const students =
          getArray(
            studentsResponse.data
          );

        console.log(
          "================================="
        );

        console.log(
          "PAYMENTS:",
          rawPayments
        );

        console.log(
          "STUDENT FEES:",
          studentFees
        );

        console.log(
          "STUDENTS:",
          students
        );

        console.log(
          "================================="
        );

        // ------------------------------------------------
        // CREATE STUDENT FEE MAP
        // ------------------------------------------------

        const studentFeeMap = {};

        studentFees.forEach(
          (fee) => {
            if (fee?.id !== undefined) {
              studentFeeMap[
                normalizeId(fee.id)
              ] = fee;
            }
          }
        );

        // ------------------------------------------------
        // CREATE STUDENT MAP
        // ------------------------------------------------

        const studentMap = {};

        students.forEach(
          (student) => {
            if (student?.id !== undefined) {
              studentMap[
                normalizeId(student.id)
              ] = student;
            }
          }
        );

        // ------------------------------------------------
        // MAP PAYMENTS
        // ------------------------------------------------

        const mappedPayments =
          rawPayments.map(
            (payment) =>
              mapPayment(
                payment,
                studentFeeMap,
                studentMap
              )
          );

        console.log(
          "================================="
        );

        console.log(
          "MAPPED PAYMENT RECORDS:",
          mappedPayments
        );

        console.log(
          "================================="
        );

        // ------------------------------------------------
        // DEBUG ADMISSION + CLASS
        // ------------------------------------------------

        mappedPayments.forEach(
          (payment) => {
            console.log(
              `Payment ${payment.id}:`,
              {
                student:
                  payment.student_name,

                student_id:
                  payment.student_id,

                admission:
                  payment.admission_number,

                classroom:
                  payment.class_name,
              }
            );
          }
        );

        setPayments(
          mappedPayments
        );

        setFilteredPayments(
          mappedPayments
        );
      } catch (err) {
        console.error(
          "PAYMENTS LOAD ERROR:",
          err.response?.data ||
            err.message ||
            err
        );

        setError(
          "Could not load payment records."
        );

        setPayments([]);
        setFilteredPayments([]);
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
    fetchPayments();
  }, [fetchPayments]);

  // ===================================================
  // SEARCH + FILTER
  // ===================================================

  useEffect(() => {
    let result = [
      ...payments,
    ];

    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------

    if (searchTerm.trim()) {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      result =
        result.filter(
          (payment) => {
            const name =
              String(
                payment.student_name ||
                  ""
              ).toLowerCase();

            const admission =
              String(
                payment.admission_number ||
                  ""
              ).toLowerCase();

            const receipt =
              String(
                payment.receipt_number ||
                  ""
              ).toLowerCase();

            const className =
              String(
                payment.class_name ||
                  ""
              ).toLowerCase();

            return (
              name.includes(search) ||
              admission.includes(search) ||
              receipt.includes(search) ||
              className.includes(search)
            );
          }
        );
    }

    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------

    if (
      filterStatus !== "all"
    ) {
      result =
        result.filter(
          (payment) =>
            payment.status ===
            filterStatus
        );
    }

    // -------------------------------------------------
    // TERM
    // -------------------------------------------------

    if (filterTerm) {
      result =
        result.filter(
          (payment) =>
            payment.term ===
            filterTerm
        );
    }

    // -------------------------------------------------
    // CLASS
    // -------------------------------------------------

    if (
      filterClass.trim()
    ) {
      const classSearch =
        filterClass
          .trim()
          .toLowerCase();

      result =
        result.filter(
          (payment) =>
            String(
              payment.class_name ||
                ""
            )
              .toLowerCase()
              .includes(
                classSearch
              )
        );
    }

    setFilteredPayments(
      result
    );
  }, [
    payments,
    searchTerm,
    filterStatus,
    filterTerm,
    filterClass,
  ]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);
        setSuccess("");
        setError("");

        await fetchPayments();

        setSuccess(
          "Payment records refreshed successfully!"
        );
      } finally {
        setRefreshing(false);
      }
    };

  // ===================================================
  // DATE
  // ===================================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "—";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "—";
    }

    return parsed.toLocaleDateString(
      "en-KE"
    );
  };

  // ===================================================
  // VIEW PAYMENT
  // ===================================================

  const viewPayment = (
    payment
  ) => {
    if (!payment?.id) {
      setError(
        "This payment does not have a valid payment ID."
      );
      return;
    }

    navigate(
      `/accountant/receipt-generator?payment=${payment.id}`
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return <Spinner />;
  }

  // ===================================================
  // SUMMARY
  // ===================================================

  const totalRecords =
    filteredPayments.length;

  const successfulPayments =
    filteredPayments.filter(
      (p) =>
        p.status === "paid"
    ).length;

  const failedPayments =
    filteredPayments.filter(
      (p) =>
        p.status === "failed"
    ).length;

  const totalReceived =
    filteredPayments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount_paid ||
            0
        ),
      0
    );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="w-full min-h-screen bg-gray-50 px-3 py-4 sm:px-4 md:px-6 space-y-4 md:space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Fee Payment Records
            </h1>

            <p className="text-gray-500 mt-1 text-sm">
              View, search and filter all student fee payments
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
            className="milk-btn w-full sm:w-auto whitespace-nowrap disabled:opacity-60"
          >
            {refreshing && (
              <ButtonSpinner />
            )}

            {refreshing
              ? "Refreshing..."
              : "🔄 Refresh List"}
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
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">

        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">
            Showing Records
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {totalRecords}
          </p>
        </div>

        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">
            Successful Payments
          </p>

          <p className="text-2xl font-bold text-green-700 mt-1">
            {successfulPayments}
          </p>
        </div>

        <div className="card p-4 border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">
            Amount Received
          </p>

          <p className="text-xl sm:text-2xl font-bold text-orange-700 mt-1">
            {formatMoney(
              totalReceived
            )}
          </p>
        </div>

      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="card space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* SEARCH */}

          <div className="sm:col-span-2">

            <label className="form-label">
              Search Student
            </label>

            <input
              type="text"
              placeholder="Name, admission number, receipt or class..."
              className="milk-input w-full"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

          </div>

          {/* STATUS */}

          <div>

            <label className="form-label">
              Payment Status
            </label>

            <select
              className="milk-input w-full"
              value={
                filterStatus
              }
              onChange={(e) =>
                setFilterStatus(
                  e.target.value
                )
              }
            >
              <option value="all">
                All Status
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="partial">
                Partial
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="failed">
                Failed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="reversed">
                Reversed
              </option>
            </select>

          </div>

          {/* TERM */}

          <div>

            <label className="form-label">
              Term
            </label>

            <select
              className="milk-input w-full"
              value={
                filterTerm
              }
              onChange={(e) =>
                setFilterTerm(
                  e.target.value
                )
              }
            >
              <option value="">
                All Terms
              </option>

              <option value="Term 1">
                Term 1
              </option>

              <option value="Term 2">
                Term 2
              </option>

              <option value="Term 3">
                Term 3
              </option>
            </select>

          </div>

        </div>

        {/* CLASS FILTER */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>

            <label className="form-label">
              Class / Grade
            </label>

            <input
              type="text"
              placeholder="Filter by class..."
              className="milk-input w-full"
              value={
                filterClass
              }
              onChange={(e) =>
                setFilterClass(
                  e.target.value
                )
              }
            />

          </div>

          <div className="flex items-center">

            <p className="text-sm text-gray-600">

              Showing{" "}

              <strong>
                {filteredPayments.length}
              </strong>{" "}

              of{" "}

              <strong>
                {payments.length}
              </strong>{" "}

              records

              {failedPayments >
                0 && (
                <>
                  {" "}·{" "}

                  <span className="text-red-600 font-semibold">
                    {failedPayments} failed
                  </span>
                </>
              )}

            </p>

          </div>

        </div>

      </div>

      {/* =================================================
          TABLE — FULLY RESPONSIVE
      ================================================= */}

      <div className="card overflow-hidden">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">

          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Payment List
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              ← Swipe horizontally on mobile →
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {filteredPayments.length}{" "}
            record
            {filteredPayments.length !==
            1
              ? "s"
              : ""}
          </span>

        </div>

        {filteredPayments.length ===
        0 ? (
          <div className="text-gray-500 text-center py-10">
            No payment records found matching your filters.
          </div>
        ) : (

          <div className="w-full overflow-x-auto rounded-lg border border-gray-200">

            <table className="w-full border-collapse text-xs md:text-sm">

              <thead>

                <tr className="bg-gray-100">

                  <th className="p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Receipt No.
                  </th>

                  <th className="p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Student Name
                  </th>

                  <th className="p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Adm No.
                  </th>

                  <th className="hidden md:table-cell p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Class / Grade
                  </th>

                  <th className="p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Amount
                  </th>

                  <th className="p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Amount Paid
                  </th>

                  <th className="hidden md:table-cell p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Total Expected
                  </th>

                  <th className="p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Balance
                  </th>

                  <th className="p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Status
                  </th>

                  <th className="hidden lg:table-cell p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Term
                  </th>

                  <th className="hidden lg:table-cell p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Academic Year
                  </th>

                  <th className="hidden sm:table-cell p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Date
                  </th>

                  <th className="p-2 md:p-3 text-left border-b whitespace-nowrap">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredPayments.map(
                  (
                    payment,
                    index
                  ) => (

                    <tr
                      key={
                        payment.id ||
                        payment.receipt_number ||
                        `payment-${index}`
                      }
                      className="hover:bg-gray-50 transition-colors"
                    >

                      <td className="p-2 md:p-3 border-b whitespace-nowrap font-medium">
                        {payment.receipt_number ||
                          "—"}
                      </td>

                      <td className="p-2 md:p-3 border-b whitespace-nowrap font-semibold">
                        {payment.student_name ||
                          "—"}
                      </td>

                      <td className="p-2 md:p-3 border-b whitespace-nowrap font-medium">
                        {payment.admission_number &&
                        payment.admission_number !==
                          "—"
                          ? payment.admission_number
                          : "—"}
                      </td>

                      <td className="hidden md:table-cell p-2 md:p-3 border-b whitespace-nowrap font-medium">
                        {payment.class_name &&
                        payment.class_name !==
                          "—"
                          ? payment.class_name
                          : "—"}
                      </td>

                      <td className="p-2 md:p-3 border-b whitespace-nowrap">
                        {formatMoney(
                          payment.amount
                        )}
                      </td>

                      <td
                        className={`p-2 md:p-3 border-b whitespace-nowrap font-semibold ${
                          payment.status ===
                            "failed" ||
                          payment.status ===
                            "cancelled" ||
                          payment.status ===
                            "reversed"
                            ? "text-gray-500"
                            : "text-green-600"
                        }`}
                      >
                        {formatMoney(
                          payment.amount_paid
                        )}
                      </td>

                      <td className="hidden md:table-cell p-2 md:p-3 border-b whitespace-nowrap">
                        {formatMoney(
                          payment.total_expected
                        )}
                      </td>

                      <td className="p-2 md:p-3 border-b whitespace-nowrap font-semibold text-red-600">
                        {formatMoney(
                          payment.balance
                        )}
                      </td>

                      <td className="p-2 md:p-3 border-b">
                        <StatusBadge
                          status={
                            payment.status
                          }
                        />
                      </td>

                      <td className="hidden lg:table-cell p-2 md:p-3 border-b whitespace-nowrap">
                        {payment.term ||
                          "—"}
                      </td>

                      <td className="hidden lg:table-cell p-2 md:p-3 border-b whitespace-nowrap">
                        {payment.academic_year ||
                          "—"}
                      </td>

                      <td className="hidden sm:table-cell p-2 md:p-3 border-b whitespace-nowrap">
                        {formatDate(
                          payment.payment_date
                        )}
                      </td>

                      <td className="p-2 md:p-3 border-b">

                        <button
                          type="button"
                          onClick={() =>
                            viewPayment(
                              payment
                            )
                          }
                          className="inline-flex items-center justify-center px-2 md:px-3 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium whitespace-nowrap transition"
                        >
                          <i className="bi bi-eye me-1"></i>

                          <span className="hidden sm:inline">View / Print</span>
                          <span className="sm:hidden">View</span>
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

export default FeeRecords;