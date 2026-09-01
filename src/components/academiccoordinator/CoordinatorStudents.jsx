import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const CoordinatorStudents = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");

  // =====================================================
  // LOAD STUDENTS + CLASSES
  // =====================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, classResponse] = await Promise.all([
        api.get("students/"),
        api.get("classes/"),
      ]);

      const studentData =
        studentResponse.data?.results ||
        studentResponse.data ||
        [];

      const classData =
        classResponse.data?.results ||
        classResponse.data ||
        [];

      setStudents(
        Array.isArray(studentData)
          ? studentData
          : []
      );

      setClasses(
        Array.isArray(classData)
          ? classData
          : []
      );
    } catch (err) {
      console.error("Failed to load students:", err);

      setError(
        err?.response?.data?.detail ||
          "Failed to load students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getStudentName = (student) => {
    const firstName = student?.first_name || "";
    const lastName = student?.last_name || "";

    const fullName =
      `${firstName} ${lastName}`.trim();

    return (
      fullName ||
      student?.user?.username ||
      "Unnamed Student"
    );
  };

  const getClassName = (student) => {
    return student?.classroom_name || "Unassigned";
  };

  const getGender = (student) => {
    if (!student?.gender) {
      return "—";
    }
    return student.gender;
  };

  // =====================================================
  // FILTER STUDENTS
  // =====================================================

  const filteredStudents = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const studentName =
        getStudentName(student).toLowerCase();

      const admissionNumber = String(
        student?.admission_number || ""
      ).toLowerCase();

      const matchesSearch =
        !search ||
        studentName.includes(search) ||
        admissionNumber.includes(search);

      const studentClassId =
        student?.classroom ?? null;

      const matchesClass =
        selectedClass === "all" ||
        String(studentClassId) === String(selectedClass);

      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const maleStudents = students.filter(
    (student) =>
      String(student?.gender || "").toLowerCase() === "male"
  ).length;

  const femaleStudents = students.filter(
    (student) =>
      String(student?.gender || "").toLowerCase() === "female"
  ).length;

  const assignedStudents = students.filter(
    (student) => Boolean(student?.classroom)
  ).length;

  // =====================================================
  // VIEW PROFILE
  // =====================================================

  const handleViewProfile = (studentId) => {
    if (!studentId) {
      console.error("Missing student ID");
      return;
    }
    navigate(`/academic-coordinator/student-details/${studentId}`);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-500">Loading students...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 sm:space-y-8 overflow-x-hidden">
      {/* =================================================
          HEADER
      ================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            Student Directory
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-xs sm:text-base">
            View, search and manage all registered students.
          </p>
        </div>
        <button type="button" onClick={loadData} className="milk-btn w-fit">
          🔄 Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 sm:p-4 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Search Student
            </label>
            <input
              type="text"
              placeholder="Name or admission number..."
              className="milk-input w-full min-w-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Filter by Class
            </label>
            <select
              className="milk-input w-full min-w-0"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={String(cls.id)}>
                  {cls.grade || cls.name || cls.class_name || "Class"}
                  {cls.stream ? ` - ${cls.stream}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-xs sm:text-sm text-gray-500">
          Showing <strong className="text-gray-800">{filteredStudents.length}</strong> of{" "}
          <strong className="text-gray-800">{students.length}</strong> students
        </div>
      </div>

      {/* =================================================
          📊 STATISTICS — FULL WIDTH STACKED ON MOBILE ✅
          CHANGED: grid-cols-1 on mobile, 4 on desktop
      ================================================= */}
      <div className="grid gap-3 sm:gap-5 grid-cols-1 md:grid-cols-4">
        <div className="stat-card py-4 sm:py-5">
          <p className="text-gray-700 font-medium text-xs sm:text-base">Total Students</p>
          <p className="stat-value">{students.length}</p>
        </div>

        <div className="stat-card py-4 sm:py-5">
          <p className="text-gray-700 font-medium text-xs sm:text-base">Male Students</p>
          <p className="stat-value">{maleStudents}</p>
        </div>

        <div className="stat-card py-4 sm:py-5">
          <p className="text-gray-700 font-medium text-xs sm:text-base">Female Students</p>
          <p className="stat-value">{femaleStudents}</p>
        </div>

        <div className="stat-card py-4 sm:py-5">
          <p className="text-gray-700 font-medium text-xs sm:text-base">Assigned to Classes</p>
          <p className="stat-value">{assignedStudents}</p>
        </div>
      </div>

      {/* =================================================
          STUDENT TABLE
      ================================================= */}
      <div className="card w-full max-w-full min-w-0 overflow-hidden p-0">
        {filteredStudents.length === 0 ? (
          <div className="text-center text-gray-500 py-10 sm:py-12 px-3">
            <p className="text-base sm:text-lg">No students found.</p>
            {(searchTerm || selectedClass !== "all") && (
              <button
                type="button"
                className="milk-btn mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedClass("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full max-w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[5%]" />
              <col className="w-[23%]" />
              <col className="w-[24%]" />
              <col className="w-[18%]" />
              <col className="w-[11%]" />
              <col className="w-[19%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-0 sm:px-2 py-2 sm:py-3 text-center text-[8px] sm:text-sm font-semibold text-gray-600">
                  #
                </th>
                <th className="px-1 sm:px-3 py-2 sm:py-3 text-left text-[8px] sm:text-sm font-semibold text-gray-600 break-words leading-tight">
                  Full Name
                </th>
                <th className="px-1 sm:px-3 py-2 sm:py-3 text-left text-[8px] sm:text-sm font-semibold text-gray-600 break-words leading-tight">
                  Admission No.
                </th>
                <th className="px-1 sm:px-3 py-2 sm:py-3 text-left text-[8px] sm:text-sm font-semibold text-gray-600 break-words leading-tight">
                  Current Class
                </th>
                <th className="px-1 sm:px-2 py-2 sm:py-3 text-center text-[8px] sm:text-sm font-semibold text-gray-600 break-words leading-tight">
                  Gender
                </th>
                <th className="px-0 sm:px-2 py-2 sm:py-3 text-center text-[8px] sm:text-sm font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student, index) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 hover:bg-green-50 transition-colors"
                >
                  <td className="px-0 sm:px-2 py-2 sm:py-4 text-center text-[8px] sm:text-sm text-gray-600 font-medium align-middle">
                    {index + 1}
                  </td>
                  <td className="px-1 sm:px-3 py-2 sm:py-4 align-middle min-w-0">
                    <div className="font-medium text-gray-800 text-[8px] sm:text-sm break-words whitespace-normal leading-3 sm:leading-5">
                      {getStudentName(student)}
                    </div>
                  </td>
                  <td className="px-1 sm:px-3 py-2 sm:py-4 align-middle min-w-0">
                    <div className="text-gray-600 text-[7px] sm:text-sm break-all whitespace-normal leading-3 sm:leading-5">
                      {student.admission_number || "—"}
                    </div>
                  </td>
                  <td className="px-1 sm:px-3 py-2 sm:py-4 align-middle min-w-0">
                    <div className="text-gray-600 text-[8px] sm:text-sm break-words whitespace-normal leading-3 sm:leading-5">
                      {getClassName(student)}
                    </div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-4 text-center align-middle min-w-0">
                    <div className="text-gray-600 text-[8px] sm:text-sm break-words whitespace-normal leading-3 sm:leading-5">
                      {getGender(student)}
                    </div>
                  </td>
                  <td className="px-0 sm:px-2 py-2 sm:py-4 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => handleViewProfile(student.id)}
                      className="inline-flex items-center justify-center max-w-full px-1 sm:px-4 py-1 sm:py-2 bg-green-600 text-white rounded sm:rounded-lg text-[7px] sm:text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors whitespace-nowrap"
                    >
                      <span className="sm:hidden">View</span>
                      <span className="hidden sm:inline">View Profile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CoordinatorStudents;