import { useEffect, useState, useCallback } from "react";
import api from "../api/api";


// =====================================================
// SPINNER
// =====================================================
const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-600"></div>
  </div>
);


// =====================================================
// HELPERS
// =====================================================
const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.assignments)) return data.assignments;
  return [];
};


const safeNumber = (val) => {
  const n = Number(val);
  return isNaN(n) || val === "" || val === null || val === undefined ? null : n;
};


// =====================================================
// MAIN COMPONENT
// =====================================================
const TeacherClassResults = () => {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClassName, setSelectedClassName] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");


  // ==========================================
  // LOAD CLASSES FROM ASSIGNMENTS
  // ==========================================
  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      setError("");

      const res = await api.get("assignments/");
      const data = getArray(res.data);
      setAssignments(data);

      const unique = [];
      const seen = new Set();
      data.forEach(a => {
        const cid = String(a.classroom_id || a.classroom);
        const cname = a.classroom_name || `${a.grade || ""} ${a.stream || ""}`.trim();
        if (cid && !seen.has(cid)) {
          seen.add(cid);
          unique.push({ id: cid, name: cname });
        }
      });
      setClasses(unique);

    } catch (err) {
      setError("Failed to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  }, []);


  // ==========================================
  // LOAD SUBJECTS
  // ==========================================
  const loadSubjects = useCallback(async (classId) => {
    if (!classId) {
      setSubjects([]);
      setSelectedMode("");
      setResults([]);
      setStudents([]);
      return;
    }

    try {
      setLoadingSubjects(true);
      setError("");
      setSelectedMode("");
      setResults([]);
      setStudents([]);

      const filtered = assignments.filter(
        a => String(a.classroom_id || a.classroom) === String(classId)
      );

      const uniqueSubjects = [];
      const seen = new Set();
      filtered.forEach(a => {
        const subjId = String(a.subject || a.subject_id);
        const subjIdNum = Number(a.subject || a.subject_id);
        const subjName = (a.subject_name || "Unknown Subject").trim();
        if (subjId && !seen.has(subjId)) {
          seen.add(subjId);
          uniqueSubjects.push({
            id: subjId,
            idNum: subjIdNum,
            name: subjName,
          });
        }
      });

      console.log("📚 Subjects loaded:", uniqueSubjects);
      setSubjects(uniqueSubjects);

    } catch (err) {
      setError("Failed to load subjects.");
    } finally {
      setLoadingSubjects(false);
    }
  }, [assignments]);


  // ==========================================
  // LOAD OVERALL PERFORMANCE — ✅ MATCH BY SUBJECT NAME
  // ==========================================
  const loadOverallPerformance = useCallback(async (classId) => {
    try {
      setLoadingResults(true);
      setError("");
      setResults([]);
      setStudents([]);

      console.log("📊 Loading overall performance for class:", classId);

      const studentsRes = await api.get(`students/?classroom=${classId}`);
      const classStudents = getArray(studentsRes.data);
      setStudents(classStudents);
      console.log("👨‍🎓 Students in class:", classStudents.length);

      const classStudentIds = new Set(classStudents.map(s => String(s.id)));
      const allResults = [];

      // Fetch results for EACH subject
      for (const subj of subjects) {
        console.log(`📤 Fetching: ${subj.name} (ID: ${subj.id} / ${subj.idNum})`);
        const res = await api.get(`results/results/?subject=${subj.idNum}`);
        const subjResults = getArray(res.data);
        console.log(`✅ ${subj.name}: got ${subjResults.length} result(s)`);

        subjResults.forEach(r => {
          const resultStudentId = String(r.student || r.student_id);
          // ✅ Use subject_name from result — THIS IS THE RELIABLE FIELD!
          const resultSubjName = (r.subject_name || "").trim();

          if (classStudentIds.has(resultStudentId)) {
            allResults.push({
              ...r,
              studentId: resultStudentId,
              subjectName: resultSubjName,
              marksValue: safeNumber(r.marks || r.score),
            });
          }
        });
      }

      console.log("📋 All combined results:", allResults);

      // Build table — MATCH BY STUDENT + SUBJECT NAME
      let tableData = classStudents.map(student => {
        const studentIdStr = String(student.id);

        // Only results for THIS student
        const studentResults = allResults.filter(
          r => String(r.studentId || r.student || r.student_id) === studentIdStr
        );

        console.log(`📝 ${student.name || student.first_name}: ${studentResults.length} result(s)`);

        const marksBySubject = {};
        let total = 0;
        let hasAnyMark = false;

        // ✅ KEY FIX: Match by SUBJECT NAME — not ID!
        studentResults.forEach(r => {
          const m = r.marksValue;
          const subjKey = r.subjectName; // e.g. "English", "Mathematics"
          marksBySubject[subjKey] = m;
          if (m !== null) {
            total += m;
            hasAnyMark = true;
          }
        });

        console.log(`🔍 marksBySubject:`, marksBySubject, `Total: ${total}`);

        const avg = subjects.length > 0 ? (total / subjects.length).toFixed(2) : "0.00";

        return {
          studentId: studentIdStr,
          studentName: student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim(),
          admissionNumber: student.admission_number || "",
          marksBySubject,
          total: hasAnyMark ? total : null,
          average: hasAnyMark ? avg : "—",
        };
      });

      // Sort by total
      tableData.sort((a, b) => {
        if (a.total === null) return 1;
        if (b.total === null) return -1;
        return b.total - a.total;
      });

      // Calculate positions
      if (tableData.length > 0) {
        let position = 1;
        tableData[0].position = tableData[0].total !== null ? position : "-";
        for (let i = 1; i < tableData.length; i++) {
          const prevTotal = tableData[i - 1].total;
          const currTotal = tableData[i].total;
          if (currTotal === null) {
            tableData[i].position = "-";
          } else if (prevTotal !== null && currTotal < prevTotal) {
            position = i + 1;
            tableData[i].position = position;
          } else {
            tableData[i].position = position;
          }
        }
      }

      console.log("✅ Final table:", tableData);
      setResults(tableData);

    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message);
      setError("Failed to load performance.");
    } finally {
      setLoadingResults(false);
    }
  }, [subjects]);


  // ==========================================
  // SINGLE SUBJECT RESULTS
  // ==========================================
  const loadSingleSubjectResults = useCallback(async (classId, subjectId) => {
    try {
      setLoadingResults(true);
      setError("");
      setResults([]);
      setStudents([]);

      console.log(`📘 Single subject: ${subjectId}`);

      const studentsRes = await api.get(`students/?classroom=${classId}`);
      const classStudents = getArray(studentsRes.data);
      setStudents(classStudents);

      const resultsRes = await api.get(`results/results/?subject=${subjectId}`);
      const allResults = getArray(resultsRes.data);
      console.log("✅ Subject results:", allResults);

      const classStudentIds = new Set(classStudents.map(s => String(s.id)));
      const filteredResults = allResults.filter(r =>
        classStudentIds.has(String(r.student || r.student_id))
      );

      let tableData = classStudents.map(student => {
        const result = filteredResults.find(
          r => String(r.student || r.student_id) === String(student.id)
        );
        const marks = safeNumber(result?.marks || result?.score);
        return {
          studentId: String(student.id),
          studentName: student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim(),
          admissionNumber: student.admission_number || "",
          marks,
        };
      });

      tableData.sort((a, b) => {
        const marksA = a.marks !== null ? a.marks : -1;
        const marksB = b.marks !== null ? b.marks : -1;
        return marksB - marksA;
      });

      if (tableData.length > 0) {
        let position = 1;
        tableData[0].position = tableData[0].marks !== null ? position : "-";
        for (let i = 1; i < tableData.length; i++) {
          const prevMarks = tableData[i - 1].marks;
          const currMarks = tableData[i].marks;
          if (currMarks === null) {
            tableData[i].position = "-";
          } else if (prevMarks !== null && currMarks < prevMarks) {
            position = i + 1;
            tableData[i].position = position;
          } else {
            tableData[i].position = position;
          }
        }
      }

      setResults(tableData);

    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message);
      setError("Failed to load results.");
    } finally {
      setLoadingResults(false);
    }
  }, []);


  // ==========================================
  // HANDLERS
  // ==========================================
  const handleClassChange = (e) => {
    const cid = e.target.value;
    setSelectedClassId(cid);
    const cls = classes.find(c => String(c.id) === String(cid));
    setSelectedClassName(cls?.name || "");
    setSelectedMode("");
    setResults([]);
    setStudents([]);
    if (cid) loadSubjects(cid);
  };


  const handleModeChange = (e) => {
    const mode = e.target.value;
    setSelectedMode(mode);
    setResults([]);
    if (mode === "overall") {
      loadOverallPerformance(selectedClassId);
    } else if (mode && selectedClassId) {
      loadSingleSubjectResults(selectedClassId, mode);
    }
  };


  useEffect(() => {
    loadClasses();
  }, [loadClasses]);


  // ==========================================
  // RENDER
  // ==========================================
  if (loadingClasses) return <Spinner />;


  return (
    <div className="p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-800">
          <i className="bi bi-bar-chart-fill me-2"></i>
          Class Results Summary
        </h3>
        <p className="text-sm text-gray-500 mt-1">Select Class → Select View → View marks & rankings.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button onClick={loadClasses} className="ml-3 text-red-700 underline text-sm">Retry</button>
        </div>
      )}

      {/* SELECTORS */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <i className="bi bi-building me-1"></i> Class
          </label>
          <select
            value={selectedClassId}
            onChange={handleClassChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 text-sm"
          >
            <option value="">-- Choose --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <i className="bi bi-table me-1"></i> View
          </label>
          <select
            value={selectedMode}
            onChange={handleModeChange}
            disabled={!selectedClassId || loadingSubjects}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Choose --</option>
            <option value="overall">📊 All Subjects</option>
            {loadingSubjects ? (
              <option disabled>Loading...</option>
            ) : (
              subjects.map(s => (
                <option key={s.id} value={s.idNum}>
                  📘 {s.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* RESULTS TABLE */}
      {selectedMode && (
        <div>
          <h4 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-4">
            <i className="bi bi-award me-2"></i>
            {selectedClassName} — {selectedMode === "overall" ? "📊 Performance" : subjects.find(s => String(s.idNum) === String(selectedMode))?.name}
          </h4>

          {loadingResults ? (
            <Spinner />
          ) : results.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4">
              <i className="bi bi-info-circle me-2"></i>
              No results found. Marks may not have been entered yet.
            </div>
          ) : selectedMode === "overall" ? (
            // OVERALL TABLE — ✅ LOOK UP BY SUBJECT NAME
            <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-1 py-2 md:px-2 md:py-3 text-center font-medium">#</th>
                    <th className="px-1 py-2 md:px-2 md:py-3 text-left font-medium">Student</th>
                    {subjects.map(s => (
                      <th key={s.id} className="px-0.5 py-2 md:px-2 md:py-3 text-center font-medium">
                        {s.name.length <= 6 ? s.name : s.name.substring(0, 6)}
                      </th>
                    ))}
                    <th className="px-1 py-2 md:px-2 md:py-3 text-center font-medium">Tot</th>
                    <th className="px-1 py-2 md:px-2 md:py-3 text-center font-medium">Avg</th>
                    <th className="px-1 py-2 md:px-2 md:py-3 text-center font-medium">Pos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((row, idx) => (
                    <tr key={row.studentId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-1 py-2 md:px-2 md:py-2.5 text-center font-medium text-gray-500">{idx + 1}</td>
                      <td className="px-1 py-2 md:px-2 md:py-2.5 font-medium text-gray-800">
                        {row.studentName.split(" ")[0]}
                      </td>
                      {subjects.map(s => {
                        // ✅ USE SUBJECT NAME AS THE KEY — NO MORE NaN / undefined!
                        const m = row.marksBySubject[s.name];
                        return (
                          <td key={s.id} className="px-0.5 py-2 md:px-2 md:py-2.5 text-center text-gray-700 font-medium">
                            {m !== undefined && m !== null ? m : "—"}
                          </td>
                        );
                      })}
                      <td className="px-1 py-2 md:px-2 md:py-2.5 text-center font-bold text-gray-800">
                        {row.total !== null ? row.total : "—"}
                      </td>
                      <td className="px-1 py-2 md:px-2 md:py-2.5 text-center text-gray-600 font-medium">
                        {row.average}
                      </td>
                      <td className="px-1 py-2 md:px-2 md:py-2.5 text-center font-bold text-blue-600">
                        {row.position}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // SINGLE SUBJECT TABLE
            <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-2 py-2 md:px-3 md:py-3 text-center font-medium">#</th>
                    <th className="px-2 py-2 md:px-3 md:py-3 text-left font-medium">Student</th>
                    <th className="px-2 py-2 md:px-3 md:py-3 text-center font-medium">Marks</th>
                    <th className="px-2 py-2 md:px-3 md:py-3 text-center font-medium">Pos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((row, idx) => (
                    <tr key={row.studentId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-2 py-2 md:px-3 md:py-2.5 text-center font-medium text-gray-500">{idx + 1}</td>
                      <td className="px-2 py-2 md:px-3 md:py-2.5 font-medium text-gray-800">
                        {row.studentName.split(" ")[0]}
                      </td>
                      <td className="px-2 py-2 md:px-3 md:py-2.5 text-center font-bold text-gray-800">
                        {row.marks !== null ? row.marks : "—"}
                      </td>
                      <td className="px-2 py-2 md:px-3 md:py-2.5 text-center font-bold text-blue-600">
                        {row.position}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


export default TeacherClassResults;