import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600"></div>
  </div>
);

// =====================================================
// FORMAT MONEY
// =====================================================

const formatMoney = (amount) => {
  return `KES ${Number(amount || 0).toLocaleString()}`;
};

// =====================================================
// FEE STRUCTURE LIST
// =====================================================

const FeeStructureList = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] =
    useState("");

  // =====================================================
  // GET FEE STRUCTURES
  // =====================================================

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "fees/fee-structures/"
      );

      console.log(
        "FEE STRUCTURES RESPONSE:",
        response.data
      );

      let data = [];

      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (
        Array.isArray(response.data?.results)
      ) {
        data = response.data.results;
      } else if (
        Array.isArray(
          response.data?.fee_structures
        )
      ) {
        data = response.data.fee_structures;
      }

      console.log(
        "FEE STRUCTURES:",
        data
      );

      setFeeStructures(data);

    } catch (error) {
      console.error(
        "Failed to load fee structures:",
        error.response?.status,
        error.response?.data ||
          error.message
      );

      toast.error(
        "Failed to load fee structures."
      );

      setFeeStructures([]);

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const getFeeName = (fee) => {
    return (
      fee.name ||
      fee.fee_name ||
      fee.title ||
      "Fee Structure"
    );
  };

  const getAmount = (fee) => {
    return (
      fee.amount ??
      fee.total_amount ??
      fee.total_fee ??
      0
    );
  };

  const getAcademicYear = (fee) => {
    return (
      fee.academic_year ||
      fee.year ||
      "—"
    );
  };

  const getTerm = (fee) => {
    return fee.term || "—";
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredFeeStructures =
    feeStructures.filter((fee) => {
      const name =
        getFeeName(fee).toLowerCase();

      const year =
        String(
          getAcademicYear(fee)
        ).toLowerCase();

      const term =
        String(
          getTerm(fee)
        ).toLowerCase();

      const searchValue =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        year.includes(searchValue) ||
        term.includes(searchValue);

      const matchesTerm =
        !termFilter ||
        String(getTerm(fee)) ===
          termFilter;

      const matchesYear =
        !academicYearFilter ||
        String(
          getAcademicYear(fee)
        ) === academicYearFilter;

      return (
        matchesSearch &&
        matchesTerm &&
        matchesYear
      );
    });

  // =====================================================
  // ACADEMIC YEARS
  // =====================================================

  const academicYears = [
    ...new Set(
      feeStructures
        .map((fee) =>
          String(
            getAcademicYear(fee)
          )
        )
        .filter(
          (year) => year !== "—"
        )
    ),
  ];

  // =====================================================
  // TOTAL AMOUNT
  // =====================================================

  const totalAmount =
    filteredFeeStructures.reduce(
      (total, fee) =>
        total +
        Number(
          getAmount(fee) || 0
        ),
      0
    );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="p-6">
        <Spinner />
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm p-6">

        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Fee Structures
        </h1>

        <p className="text-gray-500 mt-1 text-sm">
          View school fee structures for each
          academic year and term.
        </p>

      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">

          <p className="text-sm text-gray-500">
            Total Fee Structures
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {feeStructures.length}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">

          <p className="text-sm text-gray-500">
            Displayed
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {filteredFeeStructures.length}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">

          <p className="text-sm text-gray-500">
            Total Listed Amount
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {formatMoney(totalAmount)}
          </p>

        </div>

      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm p-5">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* SEARCH */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search fee structure..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

          </div>

          {/* ACADEMIC YEAR */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>

            <select
              value={academicYearFilter}
              onChange={(e) =>
                setAcademicYearFilter(
                  e.target.value
                )
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white"
            >

              <option value="">
                All Academic Years
              </option>

              {academicYears.map(
                (year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                )
              )}

            </select>

          </div>

          {/* TERM */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term
            </label>

            <select
              value={termFilter}
              onChange={(e) =>
                setTermFilter(
                  e.target.value
                )
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white"
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

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b">

          <h2 className="font-semibold text-gray-800">
            Fee Structure Records
          </h2>

        </div>

        {filteredFeeStructures.length === 0 ? (

          <div className="p-12 text-center">

            <div className="text-5xl mb-4">
              💰
            </div>

            <h3 className="font-semibold text-gray-700">
              No fee structures found
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              No fee structure records are
              currently available.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-50 border-b">

                <tr>

                  <th className="px-5 py-4 text-left font-semibold text-gray-600">
                    #
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-gray-600">
                    Fee Structure
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-gray-600">
                    Academic Year
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-gray-600">
                    Term
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-gray-600">
                    Amount
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredFeeStructures.map(
                  (fee, index) => (

                    <tr
                      key={fee.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >

                      {/* NUMBER */}

                      <td className="px-5 py-4 text-gray-500">
                        {index + 1}
                      </td>

                      {/* NAME */}

                      <td className="px-5 py-4">

                        <p className="font-semibold text-gray-800">
                          {getFeeName(fee)}
                        </p>

                        {fee.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {fee.description}
                          </p>
                        )}

                      </td>

                      {/* YEAR */}

                      <td className="px-5 py-4 text-gray-700">
                        {getAcademicYear(fee)}
                      </td>

                      {/* TERM */}

                      <td className="px-5 py-4">

                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {getTerm(fee)}
                        </span>

                      </td>

                      {/* AMOUNT */}

                      <td className="px-5 py-4 text-right font-bold text-gray-800">
                        {formatMoney(
                          getAmount(fee)
                        )}
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

export default FeeStructureList;