import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
// CHILD DETAILS
// =====================================================
const ChildDetails = () => {
  const params = useParams();
  const navigate = useNavigate();

  const studentId = params.studentId || params.id || params.pk;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");



  // =====================================================
  // FETCH CHILD
  // =====================================================
  const fetchStudent = useCallback(async () => {
    if (!studentId) {
      console.error("Student ID is missing from URL:", params);
      setError("Student ID is missing from the URL.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("📌 Fetching child:", studentId);

      const { data } = await api.get(`dashboard/parent/children/${studentId}/`);
      console.log("✅ Child details:", data);
      setStudent(data);
    } catch (err) {
      console.error("❌ Failed to load student:", err);
      if (err.response?.status === 404) {
        setError("Student not found or this student is not linked to your parent account.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError("Failed to load student details.");
      }
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, params]);



  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);



  if (loading) return <Spinner />;


  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Child</h3>
          <p className="text-red-600 mb-5">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={fetchStudent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/parent-dashboard/my-children")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Back to My Children
            </button>
          </div>
        </div>
      </div>
    );
  }


  if (!student) {
    return <div className="text-center py-10"><p className="text-gray-500">Student not found.</p></div>;
  }



  // =====================================================
  // ✅ EXTRACTED DIRECTLY FROM API
  // =====================================================
  const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Student";
  const classroom = [student.grade, student.stream].filter(Boolean).join(" ") || "Class not assigned";
  const attendancePct = student.attendance_percentage ?? "0.00";
  const feeBalance = student.fee_balance
    ? `KES ${Number(student.fee_balance).toLocaleString()}`
    : "KES 0";



  return (
    <div className="p-4 md:p-6">
      {/* BACK BUTTON */}
      <div className="mb-5">
        <button
          onClick={() => navigate("/parent-dashboard/my-children")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          ← Back to My Children
        </button>
      </div>


      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              user={{ username: fullName, profile_picture: student.photo }}
              size={60}
            />
            <div>
              <h3 className="text-xl font-bold text-gray-800">{fullName}</h3>
              <p className="text-gray-500 text-sm">{classroom}</p>
              <p className="text-gray-500 text-sm">
                Admission No: <span className="font-medium text-gray-700">{student.admission_number || "—"}</span>
              </p>
            </div>
          </div>
          <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold ${
            student.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}>
            {student.status || "Unknown"}
          </span>
        </div>
      </div>


      {/* ✅ SUMMARY CARDS — ONLY Attendance & Fee Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Attendance</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{attendancePct}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Fee Balance</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{feeBalance}</p>
        </div>
      </div>


      {/* STUDENT INFORMATION */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-5">Student Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><p className="text-xs text-gray-500 uppercase">First Name</p><p className="font-medium">{student.first_name || "—"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Last Name</p><p className="font-medium">{student.last_name || "—"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Gender</p><p className="font-medium">{student.gender || "—"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Date of Birth</p><p className="font-medium">{student.date_of_birth || "—"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Admission Number</p><p className="font-medium">{student.admission_number || "—"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Assessment Number</p><p className="font-medium">{student.assessment_number || "—"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Grade</p><p className="font-medium">{student.grade || "—"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Stream</p><p className="font-medium">{student.stream || "—"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Date Admitted</p><p className="font-medium">{student.date_admitted || "—"}</p></div>
          <div><p className="text-xs text-gray-500 uppercase">Parent Relationship</p><p className="font-medium">{student.relationship || "—"}</p></div>
        </div>
      </div>
    </div>
  );
};



export default ChildDetails;