import React, { useState } from "react";
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
  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
);

// =====================================================
// FINANCIAL REPORTS
// =====================================================

const FinancialReports = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [term, setTerm] = useState("");

  const [reportData, setReportData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (value) => {
    const number = Number(value || 0);

    return `KSh ${number.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // =====================================================
  // GENERATE FEE COLLECTION REPORT
  // =====================================================

  const generateReport = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!dateFrom || !dateTo) {
      setError("Please select start and end date.");
      return;
    }

    if (dateFrom > dateTo) {
      setError("Start date cannot be after end date.");
      return;
    }

    try {
      setLoading(true);
      setReportData(null);

      // =================================================
      // CALL EXISTING BACKEND ENDPOINT
      // =================================================

      const params = new URLSearchParams();

      if (term) {
        params.append("term", term);
      }

      const url = `reports/fees/by-term/?${params.toString()}`;

      console.log("Requesting fee collection report:", url);

      const res = await api.get(url);

      console.log("Fee collection API response:", res.data);

      // =================================================
      // HANDLE API RESPONSE
      // =================================================

      let rows = [];

      if (Array.isArray(res.data)) {
        rows = res.data;
      } else if (Array.isArray(res.data?.results)) {
        rows = res.data.results;
      } else if (Array.isArray(res.data?.data)) {
        rows = res.data.data;
      }

      // =================================================
      // FILTER TERM
      // =================================================

      let filteredRows = rows;

      if (term) {
        filteredRows = rows.filter(
          (row) =>
            String(row.term || "").toLowerCase() ===
            term.toLowerCase()
        );
      }

      // =================================================
      // CALCULATE TOTALS
      // =================================================

      const totalFee = filteredRows.reduce(
        (total, row) =>
          total + Number(row.total_fee || 0),
        0
      );

      const amountPaid = filteredRows.reduce(
        (total, row) =>
          total + Number(row.amount_paid || 0),
        0
      );

      const balance = filteredRows.reduce(
        (total, row) =>
          total + Number(row.balance || 0),
        0
      );

      const collectionRate =
        totalFee > 0
          ? Number(((amountPaid / totalFee) * 100).toFixed(2))
          : 0;

      // =================================================
      // FINAL REPORT DATA
      // =================================================

      const formattedData = {
        total_fee: totalFee,
        amount_paid: amountPaid,
        balance: balance,
        collection_rate: collectionRate,
        details: filteredRows,
      };

      console.log("Formatted fee collection report:", formattedData);

      setReportData(formattedData);

      if (filteredRows.length === 0) {
        setSuccess(
          "Report generated, but no fee records were found for the selected term."
        );
      } else {
        setSuccess(
          "Fee collection report generated successfully."
        );
      }
    } catch (err) {
      console.error(
        "Fee collection report failed:",
        err.response?.data || err.message
      );

      const serverData = err.response?.data;

      if (serverData?.detail) {
        setError(serverData.detail);
      } else if (serverData?.message) {
        setError(serverData.message);
      } else {
        setError(
          "Could not generate fee collection report. Please check the server logs."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // EXPORT REPORT
  // =====================================================

  const exportReport = async (format) => {
    if (!reportData) {
      setError("Please generate the report first.");
      return;
    }

    try {
      setExporting(true);
      setError("");
      setSuccess("");

      // =================================================
      // CSV
      // =================================================

      if (format === "csv") {
        exportCSV();

        setSuccess(
          "Fee collection report exported as CSV successfully."
        );

        return;
      }

      // =================================================
      // PDF / XLSX NOT YET CONNECTED
      // =================================================

      setError(
        `${format.toUpperCase()} export is not configured yet. CSV export is available.`
      );
    } catch (err) {
      console.error("Export failed:", err);

      setError("Failed to export report.");
    } finally {
      setExporting(false);
    }
  };

  // =====================================================
  // CSV EXPORT
  // =====================================================

  const exportCSV = () => {
    const rows = reportData?.details || [];

    if (rows.length === 0) {
      setError("There is no report data to export.");
      return;
    }

    const headers = Object.keys(rows[0]);

    const csvRows = [
      headers.join(","),

      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? "";

            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `fee_collection_report_${dateFrom}_${dateTo}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  // =====================================================
  // SUMMARY CARD
  // =====================================================

  const SummaryCard = ({
    label,
    value,
    color,
  }) => (
    <div
      className={`card p-4 border-l-4 ${color}`}
    >
      <p className="text-sm text-gray-600">
        {label}
      </p>

      <p className="text-xl font-bold mt-1">
        {value}
      </p>
    </div>
  );

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="card">

        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Fee Collection Report
        </h1>

        <p className="text-gray-500 mt-1 text-sm">
          Generate and review school fee collection reports.
        </p>

      </div>

      {/* =================================================
          STATUS
      ================================================= */}

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 p-4">
          {error}
        </div>
      )}

      {success && (
        <div className="card bg-green-50 border border-green-200 text-green-700 p-4">
          {success}
        </div>
      )}

      {/* =================================================
          FILTER FORM
      ================================================= */}

      <div className="card">

        <form
          onSubmit={generateReport}
          className="space-y-4"
        >

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* REPORT TYPE */}

            <div>

              <label className="form-lable">
                Report Type
              </label>

              <input
                type="text"
                value="Fee Collection"
                disabled
                className="milk-input w-full bg-gray-100"
              />

            </div>

            {/* START DATE */}

            <div>

              <label className="form-lable">
                Start Date *
              </label>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) =>
                  setDateFrom(e.target.value)
                }
                className="milk-input w-full"
                required
              />

            </div>

            {/* END DATE */}

            <div>

              <label className="form-lable">
                End Date *
              </label>

              <input
                type="date"
                value={dateTo}
                onChange={(e) =>
                  setDateTo(e.target.value)
                }
                className="milk-input w-full"
                required
              />

            </div>

          </div>

          {/* TERM */}

          <div className="max-w-md">

            <label className="form-lable">
              Academic Term
            </label>

            <select
              value={term}
              onChange={(e) =>
                setTerm(e.target.value)
              }
              className="milk-input w-full"
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

          {/* BUTTON */}

          <button
            type="submit"
            className="milk-btn"
            disabled={loading}
          >

            {loading && <ButtonSpinner />}

            {loading
              ? "Generating..."
              : "🔍 Generate Fee Collection Report"}

          </button>

        </form>

      </div>

      {/* =================================================
          EXPORT
      ================================================= */}

      {reportData && (
        <div className="card flex flex-wrap gap-3 items-center">

          <p className="font-medium text-gray-700">
            Export:
          </p>

          <button
            onClick={() =>
              exportReport("csv")
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={exporting}
          >

            {exporting && <ButtonSpinner />}

            CSV File

          </button>

          <button
            onClick={() =>
              exportReport("pdf")
            }
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            disabled={exporting}
          >

            PDF Document

          </button>

          <button
            onClick={() =>
              exportReport("xlsx")
            }
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            disabled={exporting}
          >

            Excel Spreadsheet

          </button>

        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading && <Spinner />}

      {/* =================================================
          REPORT PREVIEW
      ================================================= */}

      {!loading && reportData && (

        <div className="card space-y-6">

          {/* REPORT TITLE */}

          <div className="border-b pb-3">

            <h2 className="text-lg font-semibold text-gray-800">
              FEE COLLECTION REPORT
            </h2>

            <p className="text-sm text-gray-500 mt-1">

              {new Date(
                dateFrom
              ).toLocaleDateString()}

              {" "}to{" "}

              {new Date(
                dateTo
              ).toLocaleDateString()}

              {term && ` | ${term}`}

            </p>

          </div>

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <SummaryCard
              label="Total Fees"
              value={formatMoney(
                reportData.total_fee
              )}
              color="border-blue-500 bg-blue-50"
            />

            <SummaryCard
              label="Amount Collected"
              value={formatMoney(
                reportData.amount_paid
              )}
              color="border-green-500 bg-green-50"
            />

            <SummaryCard
              label="Outstanding Balance"
              value={formatMoney(
                reportData.balance
              )}
              color="border-red-500 bg-red-50"
            />

            <SummaryCard
              label="Collection Rate"
              value={`${reportData.collection_rate}%`}
              color="border-indigo-500 bg-indigo-50"
            />

          </div>

          {/* =================================================
              REPORT TABLE
          ================================================= */}

          {reportData.details &&
          reportData.details.length > 0 ? (

            <div className="overflow-x-auto">

              <h3 className="font-medium text-gray-700 mb-3">
                Fee Collection Breakdown
              </h3>

              <table className="w-full border-collapse">

                <thead>

                  <tr className="bg-gray-100">

                    <th className="p-3 text-left border-b">
                      Academic Year
                    </th>

                    <th className="p-3 text-left border-b">
                      Term
                    </th>

                    <th className="p-3 text-right border-b">
                      Total Fee
                    </th>

                    <th className="p-3 text-right border-b">
                      Amount Paid
                    </th>

                    <th className="p-3 text-right border-b">
                      Balance
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {reportData.details.map(
                    (row, index) => (

                      <tr
                        key={`${row.academic_year}-${row.term}-${index}`}
                        className="hover:bg-gray-50"
                      >

                        <td className="p-3 border-b">
                          {row.academic_year}
                        </td>

                        <td className="p-3 border-b">
                          {row.term}
                        </td>

                        <td className="p-3 border-b text-right">
                          {formatMoney(
                            row.total_fee
                          )}
                        </td>

                        <td className="p-3 border-b text-right text-green-700 font-medium">
                          {formatMoney(
                            row.amount_paid
                          )}
                        </td>

                        <td className="p-3 border-b text-right text-red-700 font-medium">
                          {formatMoney(
                            row.balance
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

                {/* =================================================
                    TOTAL
                ================================================= */}

                <tfoot>

                  <tr className="bg-gray-100 font-bold">

                    <td
                      colSpan="2"
                      className="p-3 border-t"
                    >
                      TOTAL
                    </td>

                    <td className="p-3 border-t text-right">
                      {formatMoney(
                        reportData.total_fee
                      )}
                    </td>

                    <td className="p-3 border-t text-right text-green-700">
                      {formatMoney(
                        reportData.amount_paid
                      )}
                    </td>

                    <td className="p-3 border-t text-right text-red-700">
                      {formatMoney(
                        reportData.balance
                      )}
                    </td>

                  </tr>

                </tfoot>

              </table>

            </div>

          ) : (

            <div className="text-center py-10 text-gray-500">

              No fee collection records found
              for the selected filters.

            </div>

          )}

        </div>

      )}

    </div>
  );
};

export default FinancialReports;