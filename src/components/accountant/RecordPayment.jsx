import React, { useEffect, useState } from "react";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
  </div>
);

const ButtonSpinner = () => (
  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
);

// =====================================================
// FORMAT MONEY
// =====================================================

const formatMoney = (amount) => {
  return `KES ${Number(amount || 0).toLocaleString()}`;
};

// =====================================================
// GENERATE RECEIPT NUMBER
// =====================================================

const generateReceiptNumber = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(100000 + Math.random() * 900000);

  return `REC-${year}${month}${day}-${random}`;
};

// =====================================================
// RECORD PAYMENT
// =====================================================

const RecordPayment = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [searchStudent, setSearchStudent] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [studentFee, setStudentFee] = useState(null);

  const [studentBalance, setStudentBalance] = useState({
    total_expected: 0,
    total_paid: 0,
    balance: 0,
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "",
    transaction_ref: "",
    term: "",
    notes: "",
  });

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [showStudentList, setShowStudentList] = useState(false);

  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        setError("");

        const response = await api.get("students/");

        console.log("STUDENTS RESPONSE:", response.data);

        let studentList = [];

        if (Array.isArray(response.data)) {
          studentList = response.data;
        } else if (Array.isArray(response.data?.results)) {
          studentList = response.data.results;
        } else if (Array.isArray(response.data?.students)) {
          studentList = response.data.students;
        }

        setStudents(studentList);
      } catch (err) {
        console.error(
          "Failed to load students:",
          err.response?.data || err.message
        );

        setError("Could not load student list.");
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  // =====================================================
  // GET STUDENT NAME
  // =====================================================

  const getStudentName = (student) => {
    if (student?.name) {
      return student.name;
    }

    if (student?.student_name) {
      return student.student_name;
    }

    return `${student?.first_name || ""} ${
      student?.last_name || ""
    }`.trim();
  };

  // =====================================================
  // GET ADMISSION NUMBER
  // =====================================================

  const getAdmissionNumber = (student) => {
    return (
      student?.admission_number ||
      student?.admission_no ||
      "—"
    );
  };

  // =====================================================
  // FILTER STUDENTS
  // =====================================================

  useEffect(() => {
    const search = searchStudent.trim().toLowerCase();

    if (!search) {
      setFilteredStudents([]);
      return;
    }

    const filtered = students.filter((student) => {
      const name = getStudentName(student).toLowerCase();

      const admissionNumber = String(
        getAdmissionNumber(student)
      ).toLowerCase();

      return (
        name.includes(search) ||
        admissionNumber.includes(search)
      );
    });

    setFilteredStudents(filtered);
  }, [searchStudent, students]);

  // =====================================================
  // GET STUDENT FEE ACCOUNT
  // =====================================================

  const loadStudentFee = async (studentId) => {
    try {
      console.log(
        "Loading student fee account for:",
        studentId
      );

      /*
       * Your backend already exposes:
       *
       * GET /api/fees/student/<student_id>/
       *
       * This is preferable to inventing another endpoint.
       */

      const response = await api.get(
        `fees/student/${studentId}/`
      );

      console.log(
        "STUDENT FEE ACCOUNT:",
        response.data
      );

      const data = response.data;

      /*
       * Try the common possible response structures.
       */

      const feeAccount =
        data?.student_fee ||
        data?.fee_account ||
        data?.studentFee ||
        data;

      setStudentFee(feeAccount);

      return feeAccount;
    } catch (err) {
      console.error(
        "Failed to load student fee account:",
        err.response?.data || err.message
      );

      setStudentFee(null);

      return null;
    }
  };

  // =====================================================
  // SELECT STUDENT
  // =====================================================

  const handleSelectStudent = async (student) => {
    console.log("SELECTED STUDENT:", student);

    setSelectedStudent(student);

    setSearchStudent(getStudentName(student));

    setShowStudentList(false);

    setSuccess("");
    setError("");

    setStudentFee(null);

    setStudentBalance({
      total_expected: 0,
      total_paid: 0,
      balance: 0,
    });

    try {
      setLoadingBalance(true);

      // =================================================
      // LOAD STUDENT FEE ACCOUNT
      // =================================================

      const feeAccount = await loadStudentFee(
        student.id
      );

      console.log(
        "FEE ACCOUNT AFTER LOAD:",
        feeAccount
      );

      // =================================================
      // LOAD BALANCE
      // =================================================

      try {
        const response = await api.get(
          `fees/student/${student.id}/`
        );

        console.log(
          "STUDENT BALANCE:",
          response.data
        );

        setStudentBalance({
          total_expected: Number(
            response.data?.total_expected || 0
          ),

          total_paid: Number(
            response.data?.total_paid || 0
          ),

          balance: Number(
            response.data?.balance || 0
          ),
        });
      } catch (balanceError) {
        console.warn(
          "Balance endpoint unavailable:",
          balanceError.response?.data ||
            balanceError.message
        );

        // Try information from fee account

        if (feeAccount) {
          setStudentBalance({
            total_expected: Number(
              feeAccount.total_expected ||
                feeAccount.total_fee ||
                feeAccount.amount ||
                0
            ),

            total_paid: Number(
              feeAccount.total_paid ||
                feeAccount.amount_paid ||
                0
            ),

            balance: Number(
              feeAccount.balance ||
                feeAccount.remaining_balance ||
                0
            ),
          });
        }
      }
    } catch (err) {
      console.error(
        "Student fee loading error:",
        err
      );

      setError(
        "Could not load the student's fee account."
      );
    } finally {
      setLoadingBalance(false);
    }
  };

  // =====================================================
  // STUDENT SEARCH
  // =====================================================

  const handleStudentSearch = (e) => {
    const value = e.target.value;

    setSearchStudent(value);

    setSelectedStudent(null);

    setStudentFee(null);

    setShowStudentList(true);

    setSuccess("");
    setError("");
  };

  // =====================================================
  // PAYMENT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPaymentData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  };

  // =====================================================
  // GET STUDENT FEE ID
  // =====================================================

  const getStudentFeeId = () => {
    if (!studentFee) {
      return null;
    }

    return (
      studentFee.id ||
      studentFee.student_fee_id ||
      studentFee.fee_id ||
      studentFee.pk ||
      null
    );
  };

  // =====================================================
  // SUBMIT PAYMENT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // =================================================
    // STUDENT VALIDATION
    // =================================================

    if (!selectedStudent) {
      setError(
        "Please search and select a student first."
      );
      return;
    }

    // =================================================
    // AMOUNT VALIDATION
    // =================================================

    const amount = Number(
      paymentData.amount
    );

    if (
      !paymentData.amount ||
      isNaN(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid payment amount."
      );
      return;
    }

    // =================================================
    // PAYMENT METHOD
    // =================================================

    if (!paymentData.payment_method) {
      setError(
        "Please select a payment method."
      );
      return;
    }

    // =================================================
    // TERM
    // =================================================

    if (!paymentData.term) {
      setError(
        "Please select the academic term."
      );
      return;
    }

    // =================================================
    // STUDENT FEE
    // =================================================

    const studentFeeId = getStudentFeeId();

    if (!studentFeeId) {
      setError(
        "No fee account exists for this student. Please create/generate the student's fee account from the Fee Structure first."
      );
      return;
    }

    // =================================================
    // RECEIPT NUMBER
    // =================================================

    const receiptNumber = generateReceiptNumber();

    // =================================================
    // PAYMENT PAYLOAD
    // =================================================

    const payload = {
      student_fee: studentFeeId,

      amount: amount,

      receipt_number: receiptNumber,

      payment_method:
        paymentData.payment_method,

      transaction_ref:
        paymentData.transaction_ref || "",

      term: paymentData.term,

      notes: paymentData.notes || "",
    };

    console.log(
      "================================================"
    );

    console.log(
      "PAYMENT PAYLOAD:",
      payload
    );

    console.log(
      "STUDENT FEE ID:",
      studentFeeId
    );

    console.log(
      "RECEIPT NUMBER:",
      receiptNumber
    );

    console.log(
      "================================================"
    );

    // =================================================
    // SEND PAYMENT
    // =================================================

    try {
      setSubmitting(true);

      /*
       * IMPORTANT:
       *
       * Your Django URL configuration shows:
       *
       * /api/fees/payments/
       *
       * NOT:
       *
       * /api/fees/record-payment/
       *
       */

      const response = await api.post(
        "fees/payments/",
        payload
      );

      console.log(
        "PAYMENT SUCCESS RESPONSE:",
        response.data
      );

      // =================================================
      // SUCCESS MESSAGE
      // =================================================

      setSuccess(
        `Payment recorded successfully! Receipt ${receiptNumber} generated.`
      );

      // =================================================
      // RESET FORM
      // =================================================

      setPaymentData({
        amount: "",
        payment_method: "",
        transaction_ref: "",
        term: "",
        notes: "",
      });

      setSelectedStudent(null);

      setStudentFee(null);

      setSearchStudent("");

      setFilteredStudents([]);

      setStudentBalance({
        total_expected: 0,
        total_paid: 0,
        balance: 0,
      });

    } catch (err) {
      console.error(
        "Payment save failed:",
        err.response?.status,
        err.response?.data ||
          err.message
      );

      const responseData =
        err.response?.data;

      // =================================================
      // HANDLE VALIDATION ERRORS
      // =================================================

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        const messages = [];

        Object.entries(responseData).forEach(
          ([field, value]) => {
            if (Array.isArray(value)) {
              messages.push(
                `${field}: ${value.join(", ")}`
              );
            } else {
              messages.push(
                `${field}: ${value}`
              );
            }
          }
        );

        if (messages.length > 0) {
          setError(messages.join(" | "));
        } else {
          setError(
            "Payment could not be recorded."
          );
        }
      } else if (
        typeof responseData === "string"
      ) {
        setError(responseData);
      } else {
        setError(
          "Failed to record payment. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loadingStudents) {
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

      <div className="bg-white rounded-xl shadow-sm p-6">

        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Record New Fee Payment
        </h1>

        <p className="text-gray-500 mt-1 text-sm">
          Enter student payment details and save
          the official payment record.
        </p>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">

          <div className="font-semibold mb-1">
            Payment Error
          </div>

          <div>
            {error}
          </div>

        </div>
      )}

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">

          <div className="font-semibold">
            Payment Successful
          </div>

          <div>
            {success}
          </div>

        </div>
      )}

      {/* =================================================
          FORM
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl mx-auto">

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* =================================================
              STUDENT
          ================================================= */}

          <div className="relative">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search & Select Student *
            </label>

            <input
              type="text"
              placeholder="Type student name or admission number..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchStudent}
              onChange={handleStudentSearch}
              onFocus={() => {
                if (searchStudent.trim()) {
                  setShowStudentList(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowStudentList(false);
                }, 250);
              }}
            />

            {/* =================================================
                SELECTED STUDENT
            ================================================= */}

            {selectedStudent && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-4">

                <p className="text-sm text-green-700">
                  Selected Student
                </p>

                <p className="font-semibold text-green-900">
                  {getStudentName(
                    selectedStudent
                  )}
                </p>

                <p className="text-xs text-green-700">
                  Admission No:{" "}
                  {getAdmissionNumber(
                    selectedStudent
                  )}
                </p>

                {studentFee && (
                  <p className="text-xs text-green-700 mt-1">
                    Fee Account ID:{" "}
                    {getStudentFeeId()}
                  </p>
                )}

              </div>
            )}

            {/* =================================================
                STUDENT DROPDOWN
            ================================================= */}

            {showStudentList &&
              searchStudent.trim() && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto mt-1">

                  {filteredStudents.length ===
                  0 ? (

                    <div className="p-4 text-sm text-gray-500">
                      No students found.
                    </div>

                  ) : (

                    filteredStudents.map(
                      (student) => (

                        <button
                          key={student.id}
                          type="button"
                          className="w-full text-left p-4 hover:bg-green-50 border-b last:border-b-0 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() =>
                            handleSelectStudent(
                              student
                            )
                          }
                        >

                          <p className="font-semibold text-gray-800">
                            {getStudentName(
                              student
                            )}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">

                            Adm:{" "}
                            {getAdmissionNumber(
                              student
                            )}

                            {" | "}

                            Class:{" "}
                            {student.classroom_name ||
                              student.class_name ||
                              student.classroom ||
                              "—"}

                          </p>

                        </button>

                      )
                    )

                  )}

                </div>
              )}

          </div>

          {/* =================================================
              BALANCE
          ================================================= */}

          {selectedStudent && (

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">

              {loadingBalance ? (

                <div className="text-center text-sm text-gray-500">
                  Loading student fee balance...
                </div>

              ) : (

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">

                  <div>

                    <p className="text-sm text-gray-600">
                      Total Expected
                    </p>

                    <p className="font-bold text-lg">
                      {formatMoney(
                        studentBalance.total_expected
                      )}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-gray-600">
                      Total Paid
                    </p>

                    <p className="font-bold text-lg text-green-600">
                      {formatMoney(
                        studentBalance.total_paid
                      )}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-gray-600">
                      Outstanding Balance
                    </p>

                    <p className="font-bold text-lg text-red-600">
                      {formatMoney(
                        studentBalance.balance
                      )}
                    </p>

                  </div>

                </div>

              )}

            </div>

          )}

          {/* =================================================
              PAYMENT DETAILS
          ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* AMOUNT */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid (KSh) *
              </label>

              <input
                type="number"
                name="amount"
                min="1"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={paymentData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />

            </div>

            {/* PAYMENT METHOD */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>

              <select
                name="payment_method"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={
                  paymentData.payment_method
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  -- Select Method --
                </option>

                <option value="Cash">
                  Cash
                </option>

                <option value="M-Pesa">
                  M-Pesa
                </option>

                <option value="Bank Transfer">
                  Bank Transfer
                </option>

                <option value="Cheque">
                  Cheque
                </option>

              </select>

            </div>

            {/* TRANSACTION REF */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction / Receipt Reference
              </label>

              <input
                type="text"
                name="transaction_ref"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={
                  paymentData.transaction_ref
                }
                onChange={handleChange}
                placeholder="e.g. M-Pesa code / Cheque No."
              />

            </div>

            {/* RECEIPT NUMBER */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Number
              </label>

              <input
                type="text"
                value="Auto-generated when saved"
                disabled
                className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-4 py-3"
              />

            </div>

            {/* TERM */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Term *
              </label>

              <select
                name="term"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={paymentData.term}
                onChange={handleChange}
                required
              >

                <option value="">
                  -- Select Term --
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

            {/* NOTES */}

            <div className="md:col-span-2">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>

              <textarea
                name="notes"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={paymentData.notes}
                onChange={handleChange}
                placeholder="Optional: any extra details..."
                rows={3}
              />

            </div>

          </div>

          {/* =================================================
              SUBMIT
          ================================================= */}

          <div className="pt-2">

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedStudent ||
                !paymentData.amount ||
                !paymentData.payment_method ||
                !paymentData.term
              }
              className={`w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                submitting ||
                !selectedStudent ||
                !paymentData.amount ||
                !paymentData.payment_method ||
                !paymentData.term
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 active:bg-green-800 cursor-pointer"
              }`}
            >

              {submitting && (
                <ButtonSpinner />
              )}

              {submitting
                ? "Saving Payment..."
                : "✅ Save & Generate Receipt"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default RecordPayment;