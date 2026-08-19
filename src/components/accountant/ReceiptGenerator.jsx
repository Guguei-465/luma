import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center h-40">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
  </div>
);

// =====================================================
// RECEIPT GENERATOR
// =====================================================

const ReceiptGenerator = () => {
  const navigate = useNavigate();

  const [receiptId, setReceiptId] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH RECEIPT
  // =====================================================

  const fetchReceipt = async (e) => {
    e.preventDefault();

    if (!receiptId.trim()) {
      setError("Enter Receipt Number or Payment ID");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setReceiptData(null);

      const res = await api.get(`fees/receipt/${receiptId}/`);

      console.log("Receipt data:", res.data);

      setReceiptData(res.data);
    } catch (err) {
      console.error(
        "Receipt failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Receipt not found. Check the number and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PRINT RECEIPT
  // =====================================================

  const printReceipt = () => {
    window.print();
  };

  // =====================================================
  // FORMAT MONEY — Try ALL possible field names
  // =====================================================

  const formatMoney = (value) => {
    return `KSh ${Number(value || 0).toLocaleString()}`;
  };

  // Helper: Get amount safely — tries multiple possible field names
  const getAmount = (data) => {
    return (
      data?.amount_paid ??
      data?.amount ??
      data?.paid_amount ??
      data?.total_amount ??
      data?.payment_amount ??
      0
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* =================================================
          TOP NAVIGATION
      ================================================= */}

      <div className="flex items-center justify-between gap-3 flex-wrap">

        <button
          type="button"
          onClick={() => navigate("/accountant/fee-records")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
        >
          ← Back to Fee Records
        </button>

      </div>

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Generate Official Receipt
        </h1>

        <p className="text-gray-500 mt-1 text-sm">
          Search, preview & print payment receipts
        </p>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 p-4">
          {error}
        </div>
      )}

      {/* =================================================
          SEARCH RECEIPT
      ================================================= */}

      <div className="card max-w-md">

        <form
          onSubmit={fetchReceipt}
          className="space-y-3"
        >

          <label className="form-lable">
            Enter Receipt Number / Payment ID
          </label>

          <input
            type="text"
            className="milk-input w-full"
            placeholder="e.g. RCPT-2026-001"
            value={receiptId}
            onChange={(e) =>
              setReceiptId(e.target.value)
            }
            required
          />

          <button
            type="submit"
            className="milk-btn w-full"
            disabled={loading}
          >
            {loading ? (
              <Spinner />
            ) : (
              "🔍 Load Receipt"
            )}
          </button>

        </form>

      </div>

      {/* =================================================
          RECEIPT PREVIEW
      ================================================= */}

      {receiptData && (
        <>

          {/* PRINT BUTTON */}

          <div className="flex gap-3 mb-4">

            <button
              type="button"
              onClick={printReceipt}
              className="milk-btn"
            >
              🖨️ Print / Save PDF
            </button>

          </div>

          {/* =================================================
              RECEIPT
          ================================================= */}

          <div
            className="
              bg-white
              border-2
              border-gray-800
              rounded-lg
              p-6
              max-w-2xl
              mx-auto
              shadow-md
              print:shadow-none
            "
          >

            {/* =================================================
                SCHOOL HEADER
            ================================================= */}

            <div className="text-center mb-6 border-b pb-4">

              <h2 className="text-2xl font-bold text-gray-800">
                {receiptData.school_name || "SCHOOL NAME"}
              </h2>

              <p className="text-gray-600">
                {receiptData.school_address ||
                  "School Physical Address | P.O. Box"}
              </p>

              <p className="text-gray-600">
                Tel:{" "}
                {receiptData.school_contact ||
                  "+254 XXX XXX XXX"}
              </p>

              <h3 className="text-xl font-semibold text-blue-700 mt-3">
                OFFICIAL PAYMENT RECEIPT
              </h3>

            </div>

            {/* =================================================
                RECEIPT META
            ================================================= */}

            <div className="flex justify-between items-start mb-6">

              <div>

                <p className="text-sm text-gray-600">
                  Receipt No:{" "}
                  <strong className="text-gray-800">
                    {receiptData.receipt_number || receiptData.receipt_no || receiptData.id || "-"}
                  </strong>
                </p>

                <p className="text-sm text-gray-600">
                  Date:{" "}
                  <strong className="text-gray-800">
                    {receiptData.payment_date
                      ? new Date(
                          receiptData.payment_date
                        ).toLocaleDateString()
                      : receiptData.date
                        ? new Date(receiptData.date).toLocaleDateString()
                        : "-"}
                  </strong>
                </p>

              </div>

              <div className="text-right">

                <p className="text-sm text-gray-600">
                  Payment Method:{" "}
                  <strong className="text-gray-800">
                    {receiptData.payment_method || receiptData.method || "-"}
                  </strong>
                </p>

                {receiptData.transaction_ref && (
                  <p className="text-sm text-gray-600">
                    Trans Ref:{" "}
                    <strong>
                      {receiptData.transaction_ref || receiptData.transaction_reference}
                    </strong>
                  </p>
                )}

              </div>

            </div>

            {/* =================================================
                STUDENT DETAILS
            ================================================= */}

            <div className="bg-gray-50 p-4 rounded mb-6">

              <p className="text-sm text-gray-600">
                Paid By / Student:
              </p>

              <p className="text-lg font-bold text-gray-800">
                {receiptData.student_name || receiptData.paid_by || "-"}
              </p>

              <p className="text-sm text-gray-600">
                Admission No:{" "}
                {receiptData.admission_number || receiptData.admission || "-"}
                {" | "}
                Class:{" "}
                {receiptData.class_name || receiptData.classes || receiptData.grade_stream || "-"}
              </p>

            </div>

            {/* =================================================
                PAYMENT DETAILS — AMOUNT FIXED HERE
            ================================================= */}

            <table className="w-full mb-6">

              <thead>

                <tr className="bg-gray-100">

                  <th className="p-3 text-left border-b">
                    Description
                  </th>

                  <th className="p-3 text-right border-b">
                    Amount (KSh)
                  </th>

                </tr>

              </thead>

              <tbody>

                <tr>

                  <td className="p-3 border-b">
                    {receiptData.payment_description || receiptData.description || "Term Fee Payment"}
                  </td>

                  <td className="p-3 border-b text-right font-bold text-lg text-green-700">
                    {formatMoney(getAmount(receiptData))}
                  </td>

                </tr>

              </tbody>

            </table>

            {/* =================================================
                NOTES
            ================================================= */}

            <div className="mb-6">

              {receiptData.notes && (
                <p className="text-sm text-gray-600 mb-4">
                  Notes: {receiptData.notes}
                </p>
              )}

              <p className="text-sm text-green-700 font-medium">
                ✅ Payment Received Successfully
              </p>

            </div>

            {/* =================================================
                SIGNATURES
            ================================================= */}

            <div className="flex justify-between items-end mt-10 pt-4 border-t">

              <div>

                <p className="text-sm text-gray-600">
                  Received By:
                </p>

                <p className="font-medium">
                  {receiptData.received_by || receiptData.collected_by || "Accountant"}
                </p>

                <div className="border-b border-gray-400 w-48 mt-1"></div>

                <p className="text-xs text-gray-500 mt-1">
                  Signature & Date
                </p>

              </div>

              <div className="text-right">

                <p className="text-sm text-gray-600">
                  Official School Stamp
                </p>

                <div className="border-2 border-dashed border-gray-300 w-32 h-20 mt-2"></div>

              </div>

            </div>

          </div>

        </>
      )}

    </div>
  );
};

export default ReceiptGenerator;