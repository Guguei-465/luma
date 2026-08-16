import { useEffect, useState, useCallback } from "react";
import UserAvatar from "../UseAvata";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-green-600"></div>
  </div>
);

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

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.children)) {
    return data.children;
  }

  return [];
};

// =====================================================
// SAFE NUMBER
// =====================================================

const getNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isNaN(number) ? 0 : number;
};

// =====================================================
// SAFE VALUE
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
// MAIN COMPONENT
// =====================================================

const ParentAttendance = () => {
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ===================================================
  // FETCH CHILDREN + ATTENDANCE
  // ===================================================

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "📌 Loading parent's children..."
      );

      // =================================================
      // STEP 1
      // GET ONLY CHILDREN BELONGING TO LOGGED-IN PARENT
      // =================================================

      const childrenResponse = await api.get(
        "dashboard/parent/children/"
      );

      console.log(
        "👨‍👩‍👧 Parent children response:",
        childrenResponse.data
      );

      const childList = getArray(
        childrenResponse.data
      );

      console.log(
        "👨‍🎓 Authorized children:",
        childList
      );

      if (childList.length === 0) {
        setAttendance([]);
        return;
      }

      // =================================================
      // STEP 2
      // FETCH ATTENDANCE FOR EACH CHILD
      // =================================================

      const attendancePromises =
        childList.map(async (child) => {
          // ---------------------------------------------
          // GET STUDENT ID
          // ---------------------------------------------

          const studentId = firstValue(
            child.student_id,
            child.student,
            child.id
          );

          if (!studentId) {
            console.warn(
              "⚠️ Child does not have a student ID:",
              child
            );

            return {
              ...child,

              student_id: null,

              present: 0,

              absent: 0,

              excused: 0,

              attendance_percentage: 0,
            };
          }

          console.log(
            `📌 Fetching attendance for student ${studentId}...`
          );

          // ---------------------------------------------
          // FETCH STUDENT ATTENDANCE
          // ---------------------------------------------

          try {
            const response = await api.get(
              `attendance/student/${studentId}/`
            );

            console.log(
              `✅ Attendance for student ${studentId}:`,
              response.data
            );

            const data =
              response.data || {};

            // -------------------------------------------
            // NORMALIZE RESPONSE
            // -------------------------------------------

            const present = getNumber(
              firstValue(
                data.present,
                data.present_count,
                data.total_present
              )
            );

            const absent = getNumber(
              firstValue(
                data.absent,
                data.absent_count,
                data.total_absent
              )
            );

            const excused = getNumber(
              firstValue(
                data.excused,
                data.excused_count,
                data.total_excused
              )
            );

            const percentage = getNumber(
              firstValue(
                data.attendance_percentage,
                data.percentage,
                data.attendance_rate
              )
            );

            return {
              ...child,

              student_id: studentId,

              present,

              absent,

              excused,

              attendance_percentage:
                percentage,
            };
          } catch (attendanceError) {
            console.error(
              `❌ Attendance failed for student ${studentId}:`,
              attendanceError.response?.status,
              attendanceError.response?.data ||
                attendanceError.message
            );

            // -------------------------------------------
            // DO NOT REMOVE CHILD IF ATTENDANCE FAILS
            // -------------------------------------------

            return {
              ...child,

              student_id: studentId,

              present: 0,

              absent: 0,

              excused: 0,

              attendance_percentage: 0,

              attendance_error: true,
            };
          }
        });

      // =================================================
      // WAIT FOR ALL CHILDREN
      // =================================================

      const allAttendance =
        await Promise.all(
          attendancePromises
        );

      console.log(
        "✅ Final parent attendance:",
        allAttendance
      );

      setAttendance(allAttendance);
    } catch (err) {
      console.error(
        "❌ Failed to load parent attendance:",
        err.response?.status,
        err.response?.data ||
          err.message
      );

      setAttendance([]);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to load attendance records. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // LOAD ON PAGE OPEN
  // ===================================================

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

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
            {error}
          </p>

          <button
            type="button"
            onClick={fetchAttendance}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6">

        <h3 className="text-xl font-bold text-gray-800">
          Attendance
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Attendance summary for all your children.
        </p>

      </div>

      {/* =================================================
          CHILDREN
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {attendance.length === 0 ? (

          <div className="col-span-full">

            <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-4">
              No attendance records found for your
              children yet.
            </div>

          </div>

        ) : (

          attendance.map((child) => {

            const studentId =
              child.student_id ||
              child.student ||
              child.id;

            const firstName =
              firstValue(
                child.first_name,
                child.student_first_name,
                child.name?.split(" ")?.[0]
              ) || "";

            const lastName =
              firstValue(
                child.last_name,
                child.student_last_name
              ) || "";

            const childName =
              firstValue(
                child.name,
                `${firstName} ${lastName}`.trim()
              ) ||
              "Student";

            const classroom =
              firstValue(
                child.classroom_name,
                child.classroom,
                child.grade
                  ? `${child.grade}${
                      child.stream
                        ? ` ${child.stream}`
                        : ""
                    }`
                  : null
              ) || "Class not available";

            return (
              <div
                key={studentId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-shadow hover:shadow"
              >

                {/* =======================================
                    CHILD INFORMATION
                ======================================= */}

                <div className="flex items-center mb-4">

                  <UserAvatar
                    user={{
                      username: childName,
                      profile_picture:
                        child.photo ||
                        child.profile_picture ||
                        null,
                    }}
                    size={55}
                  />

                  <div className="ml-3">

                    <h5 className="font-bold text-gray-800">
                      {childName}
                    </h5>

                    <p className="text-sm text-gray-500">
                      {classroom}
                    </p>

                    {child.admission_number && (
                      <p className="text-xs text-gray-400 mt-1">
                        Admission No:{" "}
                        {child.admission_number}
                      </p>
                    )}

                  </div>

                </div>

                {/* =======================================
                    ATTENDANCE ERROR
                ======================================= */}

                {child.attendance_error && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-3 text-sm">
                    Attendance details could not be
                    loaded for this child.
                  </div>
                )}

                {/* =======================================
                    ATTENDANCE TABLE
                ======================================= */}

                <div className="overflow-hidden rounded-lg border border-gray-200">

                  <table className="w-full text-sm">

                    <tbody>

                      {/* PRESENT */}

                      <tr className="border-b border-gray-100">

                        <th className="px-4 py-3 text-left font-medium text-gray-500 bg-gray-50 w-2/5">
                          Present
                        </th>

                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {child.present}
                        </td>

                      </tr>

                      {/* ABSENT */}

                      <tr className="border-b border-gray-100">

                        <th className="px-4 py-3 text-left font-medium text-gray-500 bg-gray-50">
                          Absent
                        </th>

                        <td className="px-4 py-3">

                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              child.absent > 0
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {child.absent}
                          </span>

                        </td>

                      </tr>

                      {/* EXCUSED */}

                      <tr className="border-b border-gray-100">

                        <th className="px-4 py-3 text-left font-medium text-gray-500 bg-gray-50">
                          Excused
                        </th>

                        <td className="px-4 py-3">

                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              child.excused > 0
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {child.excused}
                          </span>

                        </td>

                      </tr>

                      {/* ATTENDANCE RATE */}

                      <tr>

                        <th className="px-4 py-3 text-left font-medium text-gray-500 bg-gray-50">
                          Attendance Rate
                        </th>

                        <td className="px-4 py-3">

                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              child.attendance_percentage >=
                              90
                                ? "bg-green-100 text-green-800"
                                : child.attendance_percentage >=
                                  75
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {
                              child.attendance_percentage
                            }
                            %
                          </span>

                        </td>

                      </tr>

                    </tbody>

                  </table>

                </div>

                {/* =======================================
                    TOTAL
                ======================================= */}

                <div className="mt-4 pt-3 border-t border-gray-100">

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Total recorded days
                    </span>

                    <span className="font-semibold text-gray-800">
                      {Number(child.present || 0) +
                        Number(child.absent || 0) +
                        Number(child.excused || 0)}
                    </span>

                  </div>

                </div>

              </div>
            );
          })

        )}

      </div>

      {/* =================================================
          REFRESH
      ================================================= */}

      {attendance.length > 0 && (
        <div className="mt-6 flex justify-end">

          <button
            type="button"
            onClick={fetchAttendance}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
          >
            Refresh Attendance
          </button>

        </div>
      )}

    </div>
  );
};

export default ParentAttendance;