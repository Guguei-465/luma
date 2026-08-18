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

      setStudents(Array.isArray(studentData) ? studentData : []);
      setClasses(Array.isArray(classData) ? classData : []);
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

    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || student?.user?.username || "Unnamed Student";
  };

  const getClassName = (student) => {
    // The backend already returns the display-ready label as
    // `classroom_name` (there is no nested `current_class`
    // object — `classroom` is just the FK id). Using
    // `classroom_name` directly is what actually reflects a
    // real assignment instead of always showing "Unassigned".
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
    const search = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const studentName = getStudentName(student).toLowerCase();

      const admissionNumber = String(
        student?.admission_number || ""
      ).toLowerCase();

      const matchesSearch =
        !search ||
        studentName.includes(search) ||
        admissionNumber.includes(search);

      const studentClassId = student?.classroom ?? null;

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
  // ✅ FIXED: VIEW PROFILE — NOW USES CORRECT ROUTE
  // =====================================================

  const handleViewProfile = (studentId) => {
    if (!studentId) {
      console.error("Missing student ID");
      return;
    }

    // ✅ CORRECT PATH — matches your route: /student-details/:id
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

          <p className="text-lg text-gray-500">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            Student Directory
          </h1>

          <p className="text-gray-500 mt-2">
            View, search and manage all registered students.
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

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <div className="card">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Student
            </label>

            <input
              type="text"
              placeholder="Name or admission number..."
              className="milk-input w-full"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Class
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

        <div className="mt-4 text-sm text-gray-500">
          Showing{" "}
          <strong className="text-gray-800">
            {filteredStudents.length}
          </strong>{" "}
          of{" "}
          <strong className="text-gray-800">
            {students.length}
          </strong>{" "}
          students
        </div>

      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

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
            {maleStudents}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Female Students
          </p>

          <p className="stat-value">
            {femaleStudents}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Assigned to Classes
          </p>

          <p className="stat-value">
            {assignedStudents}
          </p>
        </div>

      </div>

      {/* =================================================
          STUDENT TABLE
      ================================================= */}

      <div className="card">

        {filteredStudents.length === 0 ? (

          <div className="text-center text-gray-500 py-12">
            <p className="text-lg">
              No students found.
            </p>

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

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">

                  <th className="py-3 px-3 text-gray-600">
                    #
                  </th>

                  <th className="py-3 px-3 text-gray-600">
                    Full Name
                  </th>

                  <th className="py-3 px-3 text-gray-600">
                    Admission No.
                  </th>

                  <th className="py-3 px-3 text-gray-600">
                    Current Class
                  </th>

                  <th className="py-3 px-3 text-gray-600">
                    Gender
                  </th>

                  <th className="py-3 px-3 text-gray-600 text-center">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredStudents.map(
                  (student, index) => (

                    <tr
                      key={student.id}
                      className="border-b border-gray-100 hover:bg-green-50 transition"
                    >

                      <td className="py-3 px-3">
                        {index + 1}
                      </td>

                      <td className="py-3 px-3 font-medium text-gray-800">
                        {getStudentName(student)}
                      </td>

                      <td className="py-3 px-3">
                        {student.admission_number || "—"}
                      </td>

                      <td className="py-3 px-3">
                        {getClassName(student)}
                      </td>

                      <td className="py-3 px-3">
                        {getGender(student)}
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

export default CoordinatorStudents;