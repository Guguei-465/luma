import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom"; // ✅ Added
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
  if (Array.isArray(data?.results)) return data.results;
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
    student.classroom_name,
    student.class_name,
    student.grade_name,
    classroom?.name,
    classroom?.class_name,
    classroom?.classroom_name,
    classroom?.grade_name,
    typeof student.classroom === "string"
      ? student.classroom
      : null,
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
  const studentId =
    fee?.student_id ??
    (typeof fee?.student === "number"
      ? fee.student
      : fee?.student?.id) ??
    null;

  const lookedUpStudent =
    studentId !== null
      ? studentLookup[String(studentId)]
      : null;

  const feeStudent =
    fee?.student && typeof fee.student === "object"
      ? fee.student
      : null;

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

  const admissionNumber =
    firstValue(
      fee?.admission_number,
      fee?.admission_no,
      feeStudent?.admission_number,
      feeStudent?.admission_no,
      lookedUpStudent?.admission_number,
      lookedUpStudent?.admission_no
    ) || "—";

  const classroomFromFee =
    typeof fee?.classroom === "object"
      ? fee.classroom
      : null;

  const classroomName =
    firstValue(
      fee?.class_name,
      fee?.classroom_name,
      typeof fee?.classroom === "string"
        ? fee.classroom
        : null,
      classroomFromFee?.name,
      classroomFromFee?.class_name,
      classroomFromFee?.classroom_name,
      feeStudent?.class_name,
      feeStudent?.classroom_name,
      typeof feeStudent?.classroom === "string"
        ? feeStudent.classroom
        : null,
      lookedUpStudent?.class_name,
      lookedUpStudent?.classroom_name
    ) || "—";

  const totalExpected = Number(
    firstValue(
      fee?.total_expected,
      fee?.total_fee,
      fee?.amount,
      fee?.fee_structure?.amount,
      0
    )
  );

  const amountPaid = Number(
    firstValue(
      fee?.amount_paid,
      fee?.paid_amount,
      fee?.amount_received,
      0
    )
  );

  let balance = Number(
    firstValue(
      fee?.balance,
      fee?.balance_due,
      fee?.outstanding_balance,
      Math.max(totalExpected - amountPaid, 0)
    )
  );

  if (!Number.isFinite(balance)) {
    balance = Math.max(totalExpected - amountPaid, 0);
  }

  let status = "unpaid";
  if (amountPaid <= 0) {
    status = "unpaid";
  } else if (totalExpected > 0 && amountPaid >= totalExpected) {
    status = "paid";
  } else if (amountPaid > 0) {
    status = "partial";
  }

  const term = firstValue(fee?.term, fee?.academic_term) || "—";
  const academicYear = firstValue(fee?.academic_year) || "—";
  const isOverdue = Boolean(fee?.is_overdue);

  return {
    ...fee,
    id: fee?.id,
    student_id: studentId,
    student_name: studentName,
    admission_number: admissionNumber,
    class_name: classroomName,
    classroom: classroomName,
    total_expected: Number.isFinite(totalExpected) ? totalExpected : 0,
    total_fee: Number.isFinite(Number(fee?.total_fee))
      ? Number(fee.total_fee)
      : totalExpected,
    amount_paid: Number.isFinite(amountPaid) ? amountPaid : 0,
    balance: Number.isFinite(balance) ? balance : 0,
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
    unpaid: "bg-orange-100 text-orange-700 border border-orange-200",
    partial: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    paid: "bg-green-100 text-green-700 border border-green-200",
    overdue: "bg-red-100 text-red-700 border border-red-200",
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
      {labels[status] || String(status || "UNKNOWN").toUpperCase()}
    </span>
  );
};


// =====================================================
// COMPONENT
// =====================================================

const PendingFees = () => {
  const navigate = useNavigate(); // ✅ Hook for navigation

  const [fees, setFees] = useState([]);
  const [filteredFees, setFilteredFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");


  // ===================================================
  // FETCH DATA
  // ===================================================

  const fetchPendingFees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [studentFeesResponse, studentsResponse] = await Promise.all([
        api.get("fees/student-fees/"),
        api.get("students/"),
      ]);

      console.log("STUDENT FEES API RESPONSE:", studentFeesResponse.data);
      console.log("STUDENTS API RESPONSE:", studentsResponse.data);

      const rawFees = getArray(studentFeesResponse.data);
      const students = getArray(studentsResponse.data);

      const studentLookup = buildStudentLookup(students);
      const mappedFees = rawFees
        .map((fee) => mapPendingFee(fee, studentLookup))
        .filter((fee) => Number(fee.balance) > 0);

      setFees(mappedFees);
      setFilteredFees(mappedFees);
    } catch (err) {
      console.error(
        "PENDING FEES ERROR:",
        err?.response?.data || err?.message || err
      );
      setError("Could not load pending fee records.");
      setFees([]);
      setFilteredFees([]);
    } finally {
      setLoading(false);
    }
  }, []);


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

    if (searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      result = result.filter((fee) => {
        const name = String(fee.student_name || "").toLowerCase();
        const admission = String(fee.admission_number || "").toLowerCase();
        const className = String(fee.class_name || "").toLowerCase();
        return (
          name.includes(search) ||
          admission.includes(search) ||
          className.includes(search)
        );
      });
    }

    if (filterClass.trim()) {
      const classSearch = filterClass.trim().toLowerCase();
      result = result.filter((fee) =>
        String(fee.class_name || "").toLowerCase().includes(classSearch)
      );
    }

    setFilteredFees(result);
  }, [fees, searchTerm, filterClass]);


  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setSuccess("");
      setError("");
      await fetchPendingFees();
      setSuccess("Pending fees refreshed successfully!");
    } finally {
      setRefreshing(false);
    }
  };


  // ===================================================
  // SEND REMINDER → NAVIGATE TO NOTICES PAGE
  // ===================================================

  const handleReminder = (fee) => {
    // ✅ Navigate to notices page, optionally pass student info
    navigate("/accountant/notices", {
      state: {
        studentId: fee.student_id,
        studentName: fee.student_name,
        admissionNumber: fee.admission_number,
        class_name: fee.class_name,
        balance: fee.balance,
      },
    });
  };


  // ===================================================
  // SUMMARY
  // ===================================================

  const summary = useMemo(() => {
    const totalOutstanding = filteredFees.reduce(
      (sum, fee) => sum + Number(fee.balance || 0),
      0
    );
    const partiallyPaid = filteredFees.filter(
      (fee) => fee.status === "partial"
    ).length;
    const overdue = filteredFees.filter((fee) => fee.is_overdue).length;

    return { totalOutstanding, partiallyPaid, overdue };
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

      {/* HEADER */}
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
            {refreshing && <ButtonSpinner />}
            {refreshing ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {success && (
        <FeedbackAlert
          type="success"
          message={success}
          onDismiss={() => setSuccess("")}
        />
      )}
      {error && (
        <FeedbackAlert
          type="error"
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {/* FILTERS */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Search Student</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name or Admission Number..."
              className="milk-input w-full"
            />
          </div>
          <div>
            <label className="form-label">Class / Grade</label>
            <input
              type="text"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              placeholder="Filter by class..."
              className="milk-input w-full"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-gray-600">
            Showing <strong>{filteredFees.length}</strong> students with pending fees
          </p>
          {(searchTerm || filterClass) && (
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

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="card border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Total Outstanding Amount</p>
          <p className="text-xl md:text-2xl font-bold text-orange-700 mt-1">
            {formatMoney(summary.totalOutstanding)}
          </p>
        </div>
        <div className="card border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Partially Paid Students</p>
          <p className="text-xl md:text-2xl font-bold text-yellow-700 mt-1">
            {summary.partiallyPaid}
          </p>
        </div>
        <div className="card border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Overdue / Arrears</p>
          <p className="text-xl md:text-2xl font-bold text-red-700 mt-1">
            {summary.overdue} student{summary.overdue !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* TABLE */}
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
            {filteredFees.length} record{filteredFees.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredFees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">💰</div>
            <p className="font-medium">No pending fee records found.</p>
            <p className="text-sm mt-1">Try changing your search or class filter.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full min-w-[1050px] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">Student Name</th>
                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">Adm No.</th>
                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">Class</th>
                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">Term</th>
                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">Total Expected</th>
                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">Amount Paid</th>
                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">Balance Due</th>
                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 text-left border-b whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map((fee, index) => (
                  <tr
                    key={fee.id || fee.student_id || `fee-${index}`}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-3 py-3 border-b whitespace-nowrap font-medium text-gray-800">
                      {fee.student_name}
                    </td>
                    <td className="px-3 py-3 border-b whitespace-nowrap font-medium">
                      {fee.admission_number && fee.admission_number !== "—" ? (
                        <span className="text-gray-800">{fee.admission_number}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 border-b whitespace-nowrap">
                      {fee.class_name && fee.class_name !== "—" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                          {fee.class_name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 border-b whitespace-nowrap">{fee.term}</td>
                    <td className="px-3 py-3 border-b whitespace-nowrap">{formatMoney(fee.total_expected)}</td>
                    <td className="px-3 py-3 border-b whitespace-nowrap text-green-600 font-semibold">
                      {formatMoney(fee.amount_paid)}
                    </td>
                    <td className="px-3 py-3 border-b whitespace-nowrap text-red-600 font-bold">
                      {formatMoney(fee.balance)}
                    </td>
                    <td className="px-3 py-3 border-b">
                      <StatusBadge status={fee.is_overdue ? "overdue" : fee.status} />
                    </td>
                    <td className="px-3 py-3 border-b">
                      <button
                        type="button"
                        onClick={() => handleReminder(fee)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition"
                      >
                        <span>✉</span>
                        <span>Send Reminder</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingFees;