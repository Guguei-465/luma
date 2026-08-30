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
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.children)) return data.children;
  return [];
};


// =====================================================
// SAFE NUMBER
// =====================================================
const getNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
};


// =====================================================
// SAFE VALUE
// =====================================================
const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
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
  // FETCH CHILDREN — USE ATTENDANCE PERCENTAGE DIRECTLY
  // ===================================================
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📌 Loading parent's children...");

      // Get children list — this already has attendance_percentage!
      const childrenResponse = await api.get("dashboard/parent/children/");
      const childList = getArray(childrenResponse.data);

      console.log("👨‍🎓 Children with attendance:", childList);

      if (childList.length === 0) {
        setAttendance([]);
        return;
      }

      // ✅ Use attendance_percentage DIRECTLY from children API
      // (No separate attendance API call — that's why it was showing zeros!)
      const formattedList = childList.map((child) => {
        const studentId = firstValue(child.student_id, child.student, child.id);
        const attendancePct = getNumber(child.attendance_percentage);

        console.log(`✅ ${child.first_name}: Attendance = ${attendancePct}%`);

        return {
          ...child,
          student_id: studentId,
          attendance_percentage: attendancePct,
          present: null,  // Not provided by API yet
          absent: null,   // Not provided by API yet
          excused: null,  // Not provided by API yet
        };
      });

      setAttendance(formattedList);
    } catch (err) {
      console.error("❌ Failed to load attendance:", err);
      setAttendance([]);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to load attendance records."
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);


  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }


  // ===================================================
  // RENDER
  // ===================================================
  return (
    <div className="p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800">Attendance</h3>
        <p className="text-sm text-gray-500 mt-1">
          Attendance summary for all your children.
        </p>
      </div>

      {/* CHILDREN CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {attendance.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-4">
              No attendance records found for your children yet.
            </div>
          </div>
        ) : (
          attendance.map((child) => {
            const studentId = child.student_id;
            const firstName = firstValue(
              child.first_name,
              child.student_first_name,
              child.name?.split(" ")?.[0]
            ) || "";
            const lastName = firstValue(
              child.last_name,
              child.student_last_name
            ) || "";
            const childName = firstValue(
              child.name,
              `${firstName} ${lastName}`.trim()
            ) || "Student";
            const classroom = firstValue(
              child.classroom_name,
              child.classroom,
              child.grade ? `${child.grade} ${child.stream || ""}`.trim() : null
            ) || "Class not available";
            const attendancePct = child.attendance_percentage;

            return (
              <div
                key={studentId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-shadow hover:shadow"
              >
                {/* CHILD INFO */}
                <div className="flex items-center mb-4">
                  <UserAvatar
                    user={{
                      username: childName,
                      profile_picture: child.photo || child.profile_picture || null,
                    }}
                    size={55}
                  />
                  <div className="ml-3">
                    <h5 className="font-bold text-gray-800">{childName}</h5>
                    <p className="text-sm text-gray-500">{classroom}</p>
                    {child.admission_number && (
                      <p className="text-xs text-gray-400 mt-1">
                        Admission No: {child.admission_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* ATTENDANCE RATE — MAIN DISPLAY */}
                <div className="rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-sm text-gray-500 mb-2">Attendance Rate</p>
                  <span
                    className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
                      attendancePct >= 90
                        ? "bg-green-100 text-green-800"
                        : attendancePct >= 75
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {attendancePct}%
                  </span>
                </div>

                {/* NOTE: Present/Absent counts not yet available from API */}
                <p className="mt-3 text-xs text-gray-400 text-center">
                  Detailed daily attendance coming soon
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


export default ParentAttendance;