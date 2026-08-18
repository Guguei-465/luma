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
    // `classroom` on the Student payload is just the FK id, not
    // a nested object — the ready-to-display label is already
    // provided as `classroom_name` by the backend.
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
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            Academic Student Directory
          </h1>

          <p className="text-gray-500 mt-2">
            Monitor student academic information,
            classes and performance.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="milk-btn w-fit"
        >
          🔄 Refresh
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* FILTERS */}

      <div className="card">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>

            <input
              type="text"
              placeholder="Search by name or admission number..."
              className="milk-input w-full"
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
              className="milk-input w-full"
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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Total Students
          </p>

          <p className="stat-value">
            {students.length}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Male Students
          </p>

          <p className="stat-value">
            {maleCount}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Female Students
          </p>

          <p className="stat-value">
            {femaleCount}
          </p>
        </div>

      </div>

      {/* TABLE */}

      <div className="card">

        {filteredStudents.length === 0 ? (

          <div className="text-center text-gray-500 py-10">
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
                  className="milk-btn mt-4"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">

                  <th className="py-3 px-3">
                    #
                  </th>

                  <th className="py-3 px-3">
                    Full Name
                  </th>

                  <th className="py-3 px-3">
                    Admission No.
                  </th>

                  <th className="py-3 px-3">
                    Current Class
                  </th>

                  <th className="py-3 px-3">
                    Gender
                  </th>

                  <th className="py-3 px-3 text-center">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredStudents.map(
                  (student, index) => (

                    <tr
                      key={student.id}
                      className="border-b border-gray-100 hover:bg-green-50"
                    >

                      <td className="py-3 px-3">
                        {index + 1}
                      </td>

                      <td className="py-3 px-3 font-medium">
                        {getStudentName(student)}
                      </td>

                      <td className="py-3 px-3">
                        {student.admission_number ||
                          "—"}
                      </td>

                      <td className="py-3 px-3">
                        {getStudentClass(student)}
                      </td>

                      <td className="py-3 px-3">
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
                          className="milk-btn px-4 py-2 text-sm"
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