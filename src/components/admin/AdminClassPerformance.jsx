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
  return isNaN(n) || val === "" ? null : n;
};


// =====================================================
// MAIN COMPONENT — ADMIN VERSION
// Admin sees ALL classes, not just assigned ones
// =====================================================
const AdminClassPerformance = () => {
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
  // ADMIN LOAD ALL CLASSES (from ALL assignments)
  // ==========================================
  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      setError("");
      console.log("📚 [ADMIN] Loading ALL classes from assignments...");

      const res = await api.get("assignments/");
      const data = getArray(res.data);
      setAssignments(data);
      console.log("✅ [ADMIN] Total assignments loaded:", data.length);

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
      unique.sort((a, b) => a.name.localeCompare(b.name));
      console.log("✅ [ADMIN] Unique ALL classes:", unique);
      setClasses(unique);

    } catch (err) {
      console.error("❌ [ADMIN] Load classes error:", err);
      setError("Failed to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  }, []);


  // ==========================================
  // LOAD SUBJECTS FOR SELECTED CLASS
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

      console.log("🔍 [ADMIN] Loading subjects for class ID:", classId);

      const filtered = assignments.filter(
        a => String(a.classroom_id || a.classroom) === String(classId)
      );
      console.log("✅ [ADMIN] Assignments for this class:", filtered);

      const uniqueSubjects = [];
      const seen = new Set();
      filtered.forEach(a => {
        const subjId = String(a.subject || a.subject_id);
        const subjName = (a.subject_name || "Unknown Subject").trim();
        if (subjId && !seen.has(subjId)) {
          seen.add(subjId);
          uniqueSubjects.push({
            id: subjId,
            name: subjName,
          });
        }
      });
      console.log("✅ [ADMIN] Unique subjects for class:", uniqueSubjects);
      setSubjects(uniqueSubjects);

    } catch (err) {
      console.error("❌ [ADMIN] Load subjects error:", err);
      setError("Failed to load subjects.");
    } finally {
      setLoadingSubjects(false);
    }
  }, [assignments]);


  // ==========================================
  // LOAD OVERALL PERFORMANCE — ALL SUBJECTS
  // ==========================================
  const loadOverallPerformance = useCallback(async (classId) => {
    try {
      setLoadingResults(true);
      setError("");
      setResults([]);
      setStudents([]);

      console.log("📊 [ADMIN] Loading overall performance for class:", classId);

      const studentsRes = await api.get(`students/?classroom=${classId}`);
      const classStudents = getArray(studentsRes.data);
      console.log("✅ [ADMIN] Students in class:", classStudents);
      setStudents(classStudents);

      const classStudentIds = new Set(classStudents.map(s => String(s.id)));
      const allResults = [];

      console.log("🔍 [ADMIN] Fetching results for subjects:", subjects);

      for (const subj of subjects) {
        try {
          console.log(`📤 [ADMIN] Fetching: results/results/?subject=${subj.id} (${subj.name})`);
          const res = await api.get(`results/results/?subject=${subj.id}`);
          const subjResults = getArray(res.data);
          console.log(`✅ [ADMIN] Got ${subjResults.length} results for ${subj.name}`);

          subjResults.forEach(r => {
            if (classStudentIds.has(String(r.student || r.student_id))) {
              allResults.push({
                ...r,
                subject_id: String(r.subject || r.subject_id),
                subject_name: String(r.subject_name || r.subject || subj.name || "").trim(),
              });
            }
          });
        } catch (err) {
          console.warn(`⚠️ [ADMIN] No results for ${subj.name}:`, err.response?.status || err.message);
        }
      }

      console.log("✅ [ADMIN] ALL results combined:", allResults);

      // Build table data
      let tableData = classStudents.map(student => {
        const studentResults = allResults.filter(
          r => String(r.student || r.student_id) === String(student.id)
        );

        console.log(`🔍 [ADMIN] Student: ${student.name} (ID: ${student.id}) → matched results:`, studentResults);

        const marksBySubject = {};
        let total = 0;

        // Match marks to subjects
        subjects.forEach(subj => {
          // Try matching by ID first
          let match = studentResults.find(r =>
            String(r.subject_id || r.subject) === String(subj.id)
          );
          // Fallback: match by name
          if (!match) {
            console.log(`⚠️ [ADMIN] No ID match for ${subj.name}, trying name match...`);
            match = studentResults.find(r =>
              String(r.subject_name || "").trim() === String(subj.name || "").trim()
            );
          }

          const m = match ? safeNumber(match.marks || match.score) : null;
          marksBySubject[subj.id] = m;

          if (match) {
            console.log(`✅ [ADMIN] ${subj.name} → ${m} (matched by ${String(match.subject_id || match.subject) === String(subj.id) ? 'ID' : 'NAME'})`);
          } else {
            console.log(`❌ [ADMIN] ${subj.name} → No match`);
          }

          if (m !== null) total += m;
        });

        console.log(`📋 [ADMIN] ${student.name} → Marks:`, marksBySubject, "| Total:", total);

        return {
          studentId: student.id,
          studentName: student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim(),
          admissionNumber: student.admission_number || "",
          marksBySubject,
          total,
          average: subjects.length > 0 ? (total / subjects.length).toFixed(2) : "0.00",
        };
      });

      // Sort & assign positions
      tableData.sort((a, b) => b.total - a.total);
      if (tableData.length > 0) {
        let position = 1;
        tableData[0].position = position;
        for (let i = 1; i < tableData.length; i++) {
          if (tableData[i].total < tableData[i - 1].total) {
            position = i + 1;
          }
          tableData[i].position = position;
        }
      }

      console.log("✅ [ADMIN] FINAL TABLE DATA:", tableData);
      setResults(tableData);

    } catch (err) {
      console.error("❌ [ADMIN] Load performance error:", err);
      setError("Failed to load overall performance.");
    } finally {
      setLoadingResults(false);
    }
  }, [subjects]);


  // ==========================================
  // LOAD SINGLE SUBJECT RESULTS
  // ==========================================
  const loadSingleSubjectResults = useCallback(async (classId, subjectId) => {
    try {
      setLoadingResults(true);
      setError("");
      setResults([]);
      setStudents([]);

      console.log("📊 [ADMIN] Loading single subject — Class:", classId, "Subject:", subjectId);

      const studentsRes = await api.get(`students/?classroom=${classId}`);
      const classStudents = getArray(studentsRes.data);
      setStudents(classStudents);

      const resultsRes = await api.get(`results/results/?subject=${subjectId}`);
      const allResults = getArray(resultsRes.data);
      console.log("✅ [ADMIN] Subject results:", allResults);

      const classStudentIds = new Set(classStudents.map(s => String(s.id)));
      const filteredResults = allResults.filter(r =>
        classStudentIds.has(String(r.student || r.student_id))
      );
      console.log("✅ [ADMIN] Filtered for this class:", filteredResults);

      let tableData = classStudents.map(student => {
        const result = filteredResults.find(
          r => String(r.student || r.student_id) === String(student.id)
        );
        const marks = safeNumber(result?.marks || result?.score);
        console.log(`✅ [ADMIN] ${student.name} → Marks: ${marks}`);
        return {
          studentId: student.id,
          studentName: student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim(),
          admissionNumber: student.admission_number || "",
          marks,
        };
      });

      tableData.sort((a, b) => {
        const marksA = a.marks ?? -1;
        const marksB = b.marks ?? -1;
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

      console.log("✅ [ADMIN] FINAL SINGLE SUBJECT TABLE:", tableData);
      setResults(tableData);

    } catch (err) {
      console.error("❌ [ADMIN] Load results error:", err);
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
    console.log("🔄 [ADMIN] Class changed to ID:", cid);
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
    console.log("🔄 [ADMIN] View mode changed to:", mode);
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


  if (loadingClasses) return <Spinner />;


  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-800">
          <i className="bi bi-bar-chart-fill me-2"></i>
          All Classes Performance
        </h3>
        <p className="text-sm text-gray-500 mt-1">Admin — View performance & rankings for ANY class in the school.</p>
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
                <option key={s.id} value={s.id}>
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
            {selectedClassName} — {selectedMode === "overall" ? "📊 Performance" : subjects.find(s => String(s.id) === String(selectedMode))?.name}
          </h4>

          {loadingResults ? (
            <Spinner />
          ) : results.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4">
              <i className="bi bi-info-circle me-2"></i>
              No results found. Marks may not have been entered yet.
            </div>
          ) : selectedMode === "overall" ? (
            // ALL SUBJECTS TABLE
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
                        const m = row.marksBySubject?.[s.id];
                        return (
                          <td key={s.id} className="px-0.5 py-2 md:px-2 md:py-2.5 text-center text-gray-700 font-medium">
                            {m !== undefined && m !== null ? m : "—"}
                          </td>
                        );
                      })}
                      <td className="px-1 py-2 md:px-2 md:py-2.5 text-center font-bold text-gray-800">{row.total}</td>
                      <td className="px-1 py-2 md:px-2 md:py-2.5 text-center text-gray-600 font-medium">{row.average}</td>
                      <td className="px-1 py-2 md:px-2 md:py-2.5 text-center font-bold text-blue-600">{row.position}</td>
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
                      <td className="px-2 py-2 md:px-3 md:py-2.5 text-center font-bold text-blue-600">{row.position}</td>
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


export default AdminClassPerformance;