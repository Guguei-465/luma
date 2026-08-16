import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import UserAvatar from "../UseAvata";
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
// PARENT FEES
// =====================================================

const ParentFees = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ===================================================
  // FETCH CHILDREN + FEES
  // ===================================================

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      // =================================================
      // STEP 1: GET THIS PARENT'S CHILDREN
      // =================================================

      const childrenResponse = await api.get(
        "dashboard/parent/children/"
      );

      console.log(
        "Parent children response:",
        childrenResponse.data
      );

      const childList = Array.isArray(
        childrenResponse.data?.children
      )
        ? childrenResponse.data.children
        : Array.isArray(childrenResponse.data)
        ? childrenResponse.data
        : [];

      // =================================================
      // NO CHILDREN
      // =================================================

      if (childList.length === 0) {
        setStudents([]);
        return;
      }

      // =================================================
      // STEP 2: GET PARENT FEE RECORDS
      // =================================================

      const feesResponse = await api.get(
        "fees/student-fees/"
      );

      console.log(
        "Student fees response:",
        feesResponse.data
      );

      const feeList = Array.isArray(
        feesResponse.data
      )
        ? feesResponse.data
        : [];

      // =================================================
      // STEP 3: MATCH CHILDREN WITH FEES
      // =================================================

      const studentsWithFees = childList.map((child) => {
        const studentId =
          child.student_id ||
          child.student ||
          child.id;

        const fee = feeList.find(
          (item) =>
            Number(item.student) === Number(studentId)
        );

        console.log(
          `Fee for student ${studentId}:`,
          fee
        );

        const totalFee = Number(
          fee?.total_fee || 0
        );

        const amountPaid = Number(
          fee?.amount_paid || 0
        );

        const calculatedBalance =
          totalFee - amountPaid;

        const balance =
          fee?.balance !== undefined &&
          fee?.balance !== null
            ? Number(fee.balance)
            : calculatedBalance;

        return {
          ...child,

          // Student ID
          student_id: studentId,

          // Student name
          student_name:
            fee?.student_name ||
            `${child.first_name || ""} ${
              child.last_name || ""
            }`.trim(),

          // Fees
          total_fee: totalFee,

          amount_paid: amountPaid,

          balance: Math.max(balance, 0),

          // Academic information
          academic_year:
            fee?.academic_year || null,

          term:
            fee?.term || null,

          classroom:
            fee?.classroom ||
            child.classroom_name ||
            child.classroom ||
            "",
        };
      });

      console.log(
        "Children with individual fees:",
        studentsWithFees
      );

      setStudents(studentsWithFees);

    } catch (err) {
      console.error(
        "Failed to load parent fees:",
        err.response?.status,
        err.response?.data || err.message
      );

      setError(true);

    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return <Spinner />;
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error) {
    return (
      <div className="p-4 md:p-6">

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">

          <p className="font-medium">
            Failed to load fee records.
          </p>

          <p className="text-sm mt-1">
            We could not load your children's fee
            information. Please try again.
          </p>

          <button
            onClick={fetchFees}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6">

        <h5 className="text-xl font-bold text-gray-800">
          Fees
        </h5>

        <p className="text-sm text-gray-500 mt-1">
          Fee summary for each of your children.
        </p>

      </div>

      {/* =================================================
          NO CHILDREN
      ================================================= */}

      {students.length === 0 ? (

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">

          <div className="text-gray-400 text-4xl mb-3">
          
          </div>

          <h3 className="text-lg font-semibold text-gray-700">
            No Children Found
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            No children are currently linked to your
            parent account.
          </p>

        </div>

      ) : (

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden md:block overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Student
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Total Fee
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Amount Paid
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Balance
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200">

                {students.map((student) => {

                  const studentId =
                    student.student_id ||
                    student.id;

                  const balance =
                    Number(student.balance || 0);

                  return (

                    <tr
                      key={studentId}
                      className="hover:bg-gray-50 transition-colors"
                    >

                      {/* =================================================
                          STUDENT
                      ================================================= */}

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-3">

                          <UserAvatar
                            user={{
                              username:
                                student.first_name,
                              profile_picture:
                                student.photo,
                            }}
                            size={40}
                          />

                          <div>

                            <p className="font-semibold text-gray-900">
                              {student.first_name}{" "}
                              {student.last_name}
                            </p>

                            <p className="text-xs text-gray-500">
                              Adm:{" "}
                              {student.admission_number ||
                                "—"}
                            </p>

                            <p className="text-xs text-gray-500">
                              {student.grade || "—"}{" "}
                              {student.stream || ""}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* =================================================
                          TOTAL FEE
                      ================================================= */}

                      <td className="px-4 py-4 text-gray-700 font-medium">
                        {formatMoney(
                          student.total_fee
                        )}
                      </td>

                      {/* =================================================
                          AMOUNT PAID
                      ================================================= */}

                      <td className="px-4 py-4 text-green-600 font-medium">
                        {formatMoney(
                          student.amount_paid
                        )}
                      </td>

                      {/* =================================================
                          BALANCE
                      ================================================= */}

                      <td className="px-4 py-4">

                        <span
                          className={
                            balance > 0
                              ? "font-semibold text-red-600"
                              : "font-semibold text-green-600"
                          }
                        >
                          {formatMoney(balance)}
                        </span>

                      </td>

                      {/* =================================================
                          PAY FEES
                      ================================================= */}

                      <td className="px-4 py-4 text-center">

                        <Link
                          to={`/parent-dashboard/payments/${studentId}?tab=fees`}
                          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          💳 Pay Fees
                        </Link>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

          {/* =================================================
              MOBILE CARDS
          ================================================= */}

          <div className="md:hidden divide-y divide-gray-100">

            {students.map((student) => {

              const studentId =
                student.student_id ||
                student.id;

              const balance =
                Number(student.balance || 0);

              return (

                <div
                  key={studentId}
                  className="p-4 space-y-4"
                >

                  {/* =================================================
                      STUDENT
                  ================================================= */}

                  <div className="flex items-center gap-3">

                    <UserAvatar
                      user={{
                        username:
                          student.first_name,
                        profile_picture:
                          student.photo,
                      }}
                      size={44}
                    />

                    <div>

                      <p className="font-semibold text-gray-900">
                        {student.first_name}{" "}
                        {student.last_name}
                      </p>

                      <p className="text-xs text-gray-500">
                        Adm:{" "}
                        {student.admission_number ||
                          "—"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {student.grade || "—"}{" "}
                        {student.stream || ""}
                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      FEE DETAILS
                  ================================================= */}

                  <div className="bg-gray-50 rounded-lg p-3">

                    <div className="grid grid-cols-2 gap-y-3 text-sm">

                      <span className="text-gray-500">
                        Total Fee
                      </span>

                      <span className="font-medium text-right">
                        {formatMoney(
                          student.total_fee
                        )}
                      </span>

                      <span className="text-gray-500">
                        Amount Paid
                      </span>

                      <span className="font-medium text-green-600 text-right">
                        {formatMoney(
                          student.amount_paid
                        )}
                      </span>

                      <span className="text-gray-500">
                        Balance
                      </span>

                      <span
                        className={
                          balance > 0
                            ? "font-semibold text-red-600 text-right"
                            : "font-semibold text-green-600 text-right"
                        }
                      >
                        {formatMoney(balance)}
                      </span>

                    </div>

                  </div>

                  {/* =================================================
                      PAY FEES BUTTON
                  ================================================= */}

                  <Link
                    to={`/parent-dashboard/payments/${studentId}?tab=fees`}
                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors"
                  >
                    Pay Fees
                  </Link>

                </div>

              );

            })}

          </div>

        </div>

      )}

    </div>
  );
};

export default ParentFees;