import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const StudentsAcademic = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, classResponse] =
        await Promise.all([
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
      console.error(
        "Failed to load academic students:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getStudentName = (student) => {
    const fullName =
      `${student?.first_name || ""} ${
        student?.last_name || ""
      }`.trim();

    return (
      fullName ||
      student?.user?.username ||
      "Unnamed Student"
    );
  };

  const getStudentClass = (student) => {
    return student?.classroom_name || "Unassigned";
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredStudents = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const name =
        getStudentName(student).toLowerCase();

      const admission =
        String(
          student?.admission_number || ""
        ).toLowerCase();

      const classId = student?.classroom ?? null;

      const matchesSearch =
        !search ||
        name.includes(search) ||
        admission.includes(search);

      const matchesClass =
        selectedClass === "all" ||
        String(classId) ===
          String(selectedClass);

      return (
        matchesSearch &&
        matchesClass
      );
    });
  }, [
    students,
    searchTerm,
    selectedClass,
  ]);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleViewProfile = (studentId) => {
    navigate(
      `/academic-coordinator/students/${studentId}`
    );
  };

  // =====================================================
  // STATS
  // =====================================================

  const maleCount = students.filter(
    (student) =>
      String(student?.gender || "")
        .toLowerCase() === "male"
  ).length;

  const femaleCount = students.filter(
    (student) =>
      String(student?.gender || "")
        .toLowerCase() === "female"
  ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-500">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            Academic Student Directory
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
            Monitor student academic information,
            classes and performance.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors w-full sm:w-auto"
        >
          🔄 Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 sm:p-4 text-sm">
          {error}
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name or admission number..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(e.target.value)
              }
            >
              <option value="all">
                All Classes
              </option>
              {classes.map((cls) => (
                <option
                  key={cls.id}
                  value={String(cls.id)}
                >
                  {cls.grade ||
                    cls.name ||
                    cls.class_name ||
                    "Class"}
                  {cls.stream
                    ? ` - ${cls.stream}`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-3 sm:gap-5 grid-cols-1 sm:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">
            Total Students
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {students.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">
            Male Students
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {maleCount}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-amber-500">
          <p className="text-sm text-gray-500">
            Female Students
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {femaleCount}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="text-center text-gray-500 py-8 sm:py-10 px-4">
            No students found.
            {(searchTerm ||
              selectedClass !== "all") && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedClass("all");
                  }}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-green-200 bg-green-50">
                  <th className="py-3 px-3 text-green-700 font-semibold text-sm">
                    #
                  </th>
                  <th className="py-3 px-3 text-green-700 font-semibold text-sm whitespace-nowrap">
                    Full Name
                  </th>
                  <th className="py-3 px-3 text-green-700 font-semibold text-sm whitespace-nowrap">
                    Admission No.
                  </th>
                  <th className="py-3 px-3 text-green-700 font-semibold text-sm whitespace-nowrap">
                    Current Class
                  </th>
                  <th className="py-3 px-3 text-green-700 font-semibold text-sm whitespace-nowrap">
                    Gender
                  </th>
                  <th className="py-3 px-3 text-center text-green-700 font-semibold text-sm whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(
                  (student, index) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 hover:bg-green-50/50"
                    >
                      <td className="py-3 px-3 text-sm">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-medium text-sm">
                        {getStudentName(student)}
                      </td>
                      <td className="py-3 px-3 text-sm">
                        {student.admission_number ||
                          "—"}
                      </td>
                      <td className="py-3 px-3 text-sm">
                        {getStudentClass(student)}
                      </td>
                      <td className="py-3 px-3 text-sm">
                        {student.gender || "—"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleViewProfile(
                              student.id
                            )
                          }
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          View Profile
                        </button>
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

export default StudentsAcademic;