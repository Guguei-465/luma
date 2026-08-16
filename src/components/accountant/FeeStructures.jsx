import React, { useEffect, useState } from "react";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
  </div>
);

// =====================================================
// MONEY
// =====================================================

const formatMoney = (value) => {
  const amount = Number(value || 0);

  if (isNaN(amount)) {
    return "KES 0";
  }

  return `KES ${amount.toLocaleString()}`;
};

// =====================================================
// FEE STRUCTURES
// =====================================================

const FeeStructures = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [studentFees, setStudentFees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] = useState({
    classroom: "",
    academic_year: "2026",
    term: "",
    amount: "",
    description: "",
  });

  // ===================================================
  // GET ARRAY FROM RESPONSE
  // ===================================================

  const extractArray = (response) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.results)) {
      return response.results;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.fee_structures)) {
      return response.fee_structures;
    }

    if (Array.isArray(response?.payments)) {
      return response.payments;
    }

    if (Array.isArray(response?.student_fees)) {
      return response.student_fees;
    }

    if (Array.isArray(response?.classes)) {
      return response.classes;
    }

    return [];
  };

  // ===================================================
  // LOAD ALL FOUR GET ENDPOINTS
  // ===================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        feeStructureResponse,
        paymentResponse,
        studentFeeResponse,
        classResponse,
      ] = await Promise.all([
        // 1. FEE STRUCTURES
        api.get("fees/fee-structures/"),

        // 2. PAYMENTS
        api.get("fees/payments/"),

        // 3. STUDENT FEES
        api.get("fees/student-fees/"),

        // 4. CLASSES
        api.get("classes/"),
      ]);

      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "========================================"
      );

      console.log(
        "FEE STRUCTURES:",
        feeStructureResponse.data
      );

      console.log(
        "PAYMENTS:",
        paymentResponse.data
      );

      console.log(
        "STUDENT FEES:",
        studentFeeResponse.data
      );

      console.log(
        "CLASSES:",
        classResponse.data
      );

      console.log(
        "========================================"
      );

      // =================================================
      // EXTRACT DATA
      // =================================================

      const feeData = extractArray(
        feeStructureResponse.data
      );

      const paymentData = extractArray(
        paymentResponse.data
      );

      const studentFeeData = extractArray(
        studentFeeResponse.data
      );

      const classData = extractArray(
        classResponse.data
      );

      // =================================================
      // SAVE STATE
      // =================================================

      setFeeStructures(feeData);
      setPayments(paymentData);
      setStudentFees(studentFeeData);
      setClasses(classData);

    } catch (err) {
      console.error(
        "LOAD ALL FEE DATA ERROR:",
        err.response?.data || err.message
      );

      setError(
        "Failed to load fee structures, payments, student fee accounts, or classes."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadData();
  }, []);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ===================================================
  // CLASS NAME
  // ===================================================

  const getClassName = (fee) => {
    if (fee.classroom_name) {
      return fee.classroom_name;
    }

    if (fee.class_name) {
      return fee.class_name;
    }

    if (fee.classroom?.name) {
      return fee.classroom.name;
    }

    if (fee.classroom?.class_name) {
      return fee.classroom.class_name;
    }

    const classroomId =
      typeof fee.classroom === "object"
        ? fee.classroom?.id
        : fee.classroom;

    if (classroomId) {
      const foundClass = classes.find(
        (item) =>
          Number(item.id) === Number(classroomId)
      );

      if (foundClass) {
        return (
          foundClass.name ||
          foundClass.class_name ||
          foundClass.classroom_name ||
          foundClass.title ||
          `Class ${foundClass.id}`
        );
      }
    }

    return "—";
  };

  // ===================================================
  // AMOUNT
  // ===================================================

  const getAmount = (fee) => {
    return (
      fee.amount ??
      fee.fee_amount ??
      fee.total_amount ??
      fee.total_fee ??
      fee.amount_due ??
      fee.expected_amount ??
      0
    );
  };

  // ===================================================
  // PAYMENT AMOUNT
  // ===================================================

  const getPaymentAmount = (payment) => {
    return Number(
      payment.amount ??
      payment.amount_paid ??
      payment.paid_amount ??
      0
    );
  };

  // ===================================================
  // STUDENT FEE AMOUNT
  // ===================================================

  const getStudentFeeAmount = (studentFee) => {
    return Number(
      studentFee.total_expected ??
      studentFee.total_fee ??
      studentFee.amount ??
      studentFee.amount_due ??
      0
    );
  };

  // ===================================================
  // CREATE FEE STRUCTURE
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.classroom) {
      setError("Please select a class.");
      return;
    }

    if (!form.academic_year) {
      setError("Please enter the academic year.");
      return;
    }

    if (!form.term) {
      setError("Please select a term.");
      return;
    }

    const amount = Number(form.amount);

    if (
      !form.amount ||
      isNaN(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid fee amount greater than zero."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        classroom: Number(form.classroom),
        academic_year: Number(form.academic_year),
        term: form.term,
        amount: amount,
        description: form.description.trim(),
      };

      console.log(
        "CREATING FEE STRUCTURE:",
        payload
      );

      const response = await api.post(
        "fees/fee-structures/",
        payload
      );

      console.log(
        "FEE STRUCTURE CREATED:",
        response.data
      );

      setSuccess(
        "Fee structure created successfully."
      );

      setForm({
        classroom: "",
        academic_year: "2026",
        term: "",
        amount: "",
        description: "",
      });

      await loadData();

    } catch (err) {
      console.error(
        "CREATE FEE STRUCTURE ERROR:",
        err.response?.data || err.message
      );

      const data = err.response?.data;

      if (typeof data === "string") {
        setError(data);
      } else if (data?.detail) {
        setError(data.detail);
      } else if (data?.message) {
        setError(data.message);
      } else if (data) {
        const messages = Object.entries(data)
          .map(([field, message]) => {
            return `${field}: ${
              Array.isArray(message)
                ? message.join(", ")
                : message
            }`;
          })
          .join(" | ");

        setError(messages);
      } else {
        setError(
          "Failed to create fee structure."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // GENERATE STUDENT ACCOUNTS
  // ===================================================

  const generateAccounts = async (feeStructure) => {
    const className = getClassName(feeStructure);

    const confirmed = window.confirm(
      `Generate fee accounts for students in ${className} for ${feeStructure.term}?`
    );

    if (!confirmed) {
      return;
    }

    setGenerating(feeStructure.id);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        `fees/fee-structures/${feeStructure.id}/generate_accounts/`
      );

      console.log(
        "GENERATE ACCOUNTS RESPONSE:",
        response.data
      );

      setSuccess(
        response.data?.message ||
          "Student fee accounts generated successfully."
      );

      await loadData();

    } catch (err) {
      console.error(
        "GENERATE ACCOUNTS ERROR:",
        err.response?.data || err.message
      );

      const data = err.response?.data;

      if (typeof data === "string") {
        setError(data);
      } else if (data?.detail) {
        setError(data.detail);
      } else if (data?.message) {
        setError(data.message);
      } else {
        setError(
          "Failed to generate student fee accounts."
        );
      }
    } finally {
      setGenerating(null);
    }
  };

  // ===================================================
  // DELETE FEE STRUCTURE
  // ===================================================

  const deleteFeeStructure = async (fee) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this fee structure?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `fees/fee-structures/${fee.id}/`
      );

      setSuccess(
        "Fee structure deleted successfully."
      );

      await loadData();

    } catch (err) {
      console.error(
        "DELETE ERROR:",
        err.response?.data || err.message
      );

      setError(
        "Failed to delete fee structure."
      );
    }
  };

  // ===================================================
  // TOTALS
  // ===================================================

  const totalFeeStructures =
    feeStructures.length;

  const totalStudentAccounts =
    studentFees.length;

  const totalPayments =
    payments.length;

  const totalPaid =
    payments.reduce(
      (total, payment) =>
        total + getPaymentAmount(payment),
      0
    );

  const totalExpected =
    studentFees.reduce(
      (total, studentFee) =>
        total +
        getStudentFeeAmount(studentFee),
      0
    );

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm p-6">

        <h1 className="text-2xl font-bold text-gray-800">
          Fee Structures
        </h1>

        <p className="text-gray-500 mt-1">
          Create and manage school fee structures.
        </p>

      </div>

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
          {success}
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">

          <p className="text-sm text-gray-500">
            Fee Structures
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {totalFeeStructures}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">

          <p className="text-sm text-gray-500">
            Student Fee Accounts
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {totalStudentAccounts}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">

          <p className="text-sm text-gray-500">
            Payments Recorded
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {totalPayments}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-500">

          <p className="text-sm text-gray-500">
            Total Payments
          </p>

          <p className="text-xl font-bold text-green-600 mt-1">
            {formatMoney(totalPaid)}
          </p>

        </div>

      </div>

      {/* =================================================
          CREATE FORM
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm p-6">

        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Create Fee Structure
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >

          {/* CLASS */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class *
            </label>

            <select
              name="classroom"
              value={form.classroom}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >

              <option value="">
                -- Select Class --
              </option>

              {classes.map((item) => (

                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name ||
                    item.class_name ||
                    item.classroom_name ||
                    item.title ||
                    `Class ${item.id}`}
                </option>

              ))}

            </select>

          </div>

          {/* YEAR */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year *
            </label>

            <input
              type="number"
              name="academic_year"
              value={form.academic_year}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

          </div>

          {/* TERM */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term *
            </label>

            <select
              name="term"
              value={form.term}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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

          {/* AMOUNT */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fee Amount (KES) *
            </label>

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="1"
              step="0.01"
              required
              placeholder="30000"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

          </div>

          {/* DESCRIPTION */}

          <div className="md:col-span-2">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="e.g. Grade 1 Term 1 School Fees"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

          </div>

          {/* SUBMIT */}

          <div className="md:col-span-2">

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold transition"
            >
              {saving
                ? "Creating Fee Structure..."
                : "Create Fee Structure"}
            </button>

          </div>

        </form>

      </div>

      {/* =================================================
          EXISTING FEE STRUCTURES
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        <div className="p-6 border-b">

          <h2 className="text-xl font-semibold text-gray-800">
            Existing Fee Structures
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Fee structures loaded from the fee-structures
            endpoint.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="text-left px-6 py-4">
                  Class
                </th>

                <th className="text-left px-6 py-4">
                  Academic Year
                </th>

                <th className="text-left px-6 py-4">
                  Term
                </th>

                <th className="text-left px-6 py-4">
                  Amount
                </th>

                <th className="text-left px-6 py-4">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {feeStructures.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="text-center py-12 text-gray-500"
                  >
                    No fee structures found.
                  </td>

                </tr>

              ) : (

                feeStructures.map((fee) => {

                  const amount =
                    getAmount(fee);

                  return (
                    <tr
                      key={fee.id}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="px-6 py-4">

                        <span className="font-semibold text-gray-800">
                          {getClassName(fee)}
                        </span>

                      </td>

                      <td className="px-6 py-4">
                        {fee.academic_year || "—"}
                      </td>

                      <td className="px-6 py-4">
                        {fee.term || "—"}
                      </td>

                      <td className="px-6 py-4">

                        <span className="font-semibold text-green-600">
                          {formatMoney(amount)}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              generateAccounts(fee)
                            }
                            disabled={
                              generating === fee.id
                            }
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold"
                          >

                            {generating === fee.id
                              ? "Generating..."
                              : "Generate Accounts"}

                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteFeeStructure(fee)
                            }
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          PAYMENT DATA
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        <div className="p-6 border-b">

          <h2 className="text-xl font-semibold text-gray-800">
            Payment Records
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Payments retrieved using GET
            <code className="ml-1">
              fees/payments/
            </code>
          </p>

        </div>

        {payments.length === 0 ? (

          <div className="p-10 text-center text-gray-500">
            No payment records found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-100">

                <tr>

                  <th className="text-left px-6 py-4">
                    Receipt
                  </th>

                  <th className="text-left px-6 py-4">
                    Student
                  </th>

                  <th className="text-left px-6 py-4">
                    Method
                  </th>

                  <th className="text-left px-6 py-4">
                    Amount
                  </th>

                  <th className="text-left px-6 py-4">
                    Term
                  </th>

                </tr>

              </thead>

              <tbody>

                {payments.map((payment) => (

                  <tr
                    key={payment.id}
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="px-6 py-4 font-medium">
                      {payment.receipt_number ||
                        payment.receipt_no ||
                        "—"}
                    </td>

                    <td className="px-6 py-4">
                      {payment.student_name ||
                        payment.student?.name ||
                        payment.student_fee?.student_name ||
                        "—"}
                    </td>

                    <td className="px-6 py-4">
                      {payment.payment_method ||
                        "—"}
                    </td>

                    <td className="px-6 py-4 font-semibold text-green-600">
                      {formatMoney(
                        getPaymentAmount(payment)
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {payment.term || "—"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          STUDENT FEE ACCOUNTS
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        <div className="p-6 border-b">

          <h2 className="text-xl font-semibold text-gray-800">
            Student Fee Accounts
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Student fee accounts retrieved using GET
            <code className="ml-1">
              fees/student-fees/
            </code>
          </p>

        </div>

        {studentFees.length === 0 ? (

          <div className="p-10 text-center text-gray-500">
            No student fee accounts found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-100">

                <tr>

                  <th className="text-left px-6 py-4">
                    Student
                  </th>

                  <th className="text-left px-6 py-4">
                    Class
                  </th>

                  <th className="text-left px-6 py-4">
                    Expected
                  </th>

                  <th className="text-left px-6 py-4">
                    Paid
                  </th>

                  <th className="text-left px-6 py-4">
                    Balance
                  </th>

                </tr>

              </thead>

              <tbody>

                {studentFees.map((studentFee) => {

                  const expected =
                    Number(
                      studentFee.total_expected ??
                      studentFee.total_fee ??
                      studentFee.amount ??
                      0
                    );

                  const paid =
                    Number(
                      studentFee.total_paid ??
                      studentFee.amount_paid ??
                      studentFee.paid ??
                      0
                    );

                  const balance =
                    Number(
                      studentFee.balance ??
                      studentFee.remaining_balance ??
                      expected - paid
                    );

                  return (

                    <tr
                      key={studentFee.id}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="px-6 py-4 font-semibold">
                        {studentFee.student_name ||
                          studentFee.student?.name ||
                          studentFee.student?.student_name ||
                          "—"}
                      </td>

                      <td className="px-6 py-4">
                        {studentFee.classroom_name ||
                          studentFee.class_name ||
                          studentFee.classroom?.name ||
                          "—"}
                      </td>

                      <td className="px-6 py-4">
                        {formatMoney(expected)}
                      </td>

                      <td className="px-6 py-4 text-green-600 font-semibold">
                        {formatMoney(paid)}
                      </td>

                      <td className="px-6 py-4 text-red-600 font-semibold">
                        {formatMoney(balance)}
                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

export default FeeStructures;