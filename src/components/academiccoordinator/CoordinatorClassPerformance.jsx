import { useEffect, useState, useCallback, useRef } from "react";
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
// MAIN COMPONENT
// =====================================================
const CoordinatorClassPerformance = () => {
  const printRef = useRef(); // ← Print area reference
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
  const [assignments, setAssignments] = useState([]);

  // ==========================================
  // LOAD ALL CLASSES FROM ASSIGNMENTS
  // ==========================================
  const loadAllClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      setError("");
      const res = await api.get("assignments/");
      const data = getArray(res.data);
      setAssignments(data);
      const unique = [];
      const seen = new Set();
      data.forEach(a => {
        const cid = a.classroom_id || a.classroom;
        const cname = a.classroom_name || `${a.grade || ""} ${a.stream || ""}`.trim();
        if (cid && !seen.has(cid)) {
          seen.add(cid);
          unique.push({ id: cid, name: cname });
        }
      });
      unique.sort((a, b) => a.name.localeCompare(b.name));
      setClasses(unique);
      if (unique.length === 0) setError("No classes found.");
    } catch (err) {
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
      const filtered = assignments.filter(
        a => String(a.classroom_id || a.classroom) === String(classId)
      );
      const uniqueSubjects = [];
      const seen = new Set();
      filtered.forEach(a => {
        const subjId = a.subject || a.subject_id;
        const subjName = a.subject_name || "Unknown Subject";
        if (subjId && !seen.has(subjId)) {
          seen.add(subjId);
          uniqueSubjects.push({ id: subjId, name: subjName });
        }
      });
      setSubjects(uniqueSubjects);
    } catch (err) {
      setError("Failed to load subjects.");
    } finally {
      setLoadingSubjects(false);
    }
  }, [assignments]);

  // ==========================================
  // LOAD OVERALL PERFORMANCE
  // ==========================================
  const loadOverallPerformance = useCallback(async (classId) => {
    try {
      setLoadingResults(true);
      setError("");
      setResults([]);
      setStudents([]);
      const studentsRes = await api.get(`students/?classroom=${classId}`);
      const classStudents = getArray(studentsRes.data);
      setStudents(classStudents);
      const classStudentIds = new Set(classStudents.map(s => String(s.id)));
      const allResults = [];
      for (const subj of subjects) {
        try {
          const res = await api.get(`results/results/?subject=${subj.id}`);
          const subjResults = getArray(res.data);
          subjResults.forEach(r => {
            if (classStudentIds.has(String(r.student || r.student_id))) {
              allResults.push({ ...r, subject_name: subj.name, subject_id: subj.id });
            }
          });
        } catch (err) {
          if (err.response?.status !== 403) throw err;
        }
      }
      let tableData = classStudents.map(student => {
        const studentResults = allResults.filter(
          r => String(r.student || r.student_id) === String(student.id)
        );
        const marksBySubject = {};
        let total = 0;
        studentResults.forEach(r => {
          const m = safeNumber(r.marks || r.score);
          marksBySubject[r.subject_id] = m;
          if (m !== null) total += m;
        });
        return {
          studentId: student.id,
          studentName: student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim(),
          admissionNumber: student.admission_number || "",
          marksBySubject,
          total,
          average: subjects.length > 0 ? (total / subjects.length).toFixed(2) : "0.00",
        };
      });
      tableData.sort((a, b) => b.total - a.total);
      if (tableData.length > 0) {
        let position = 1;
        tableData[0].position = position;
        for (let i = 1; i < tableData.length; i++) {
          if (tableData[i].total < tableData[i - 1].total) position = i + 1;
          tableData[i].position = position;
        }
      }
      setResults(tableData);
    } catch (err) {
      if (err.response?.status === 403) setError("⚠️ Permission denied on results.");
      else setError("Failed to load performance data.");
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
      const studentsRes = await api.get(`students/?classroom=${classId}`);
      const classStudents = getArray(studentsRes.data);
      setStudents(classStudents);
      const resultsRes = await api.get(`results/results/?subject=${subjectId}`);
      const allResults = getArray(resultsRes.data);
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
          if (currMarks === null) tableData[i].position = "-";
          else if (prevMarks !== null && currMarks < prevMarks) {
            position = i + 1;
            tableData[i].position = position;
          } else tableData[i].position = position;
        }
      }
      setResults(tableData);
    } catch (err) {
      if (err.response?.status === 403) setError("⚠️ Permission denied on results.");
      else setError("Failed to load results.");
    } finally {
      setLoadingResults(false);
    }
  }, []);

  // ==========================================
  // PRINT HANDLER
  // ==========================================
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "", "width=900,height=700");
    const viewTitle = selectedMode === "overall"
      ? `${selectedClassName} — Performance Overview`
      : `${selectedClassName} — ${subjects.find(s => String(s.id) === String(selectedMode))?.name || ""}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${viewTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 13px; }
            h2 { color: #15803d; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px 6px; text-align: center; }
            th { background: #15803d; color: white; font-weight: bold; }
            tr:nth-child(even) { background: #f9fafb; }
            .text-left { text-align: left; }
            .footer { margin-top: 20px; font-size: 11px; color: #666; }
            @media print {
              body { padding: 10px; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h2>${viewTitle}</h2>
          ${printContent.innerHTML}
          <div class="footer">Generated by Luma 2000 Academy — CBC System</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

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
    if (mode === "overall") loadOverallPerformance(selectedClassId);
    else if (mode && selectedClassId) loadSingleSubjectResults(selectedClassId, mode);
  };

  useEffect(() => {
    loadAllClasses();
  }, [loadAllClasses]);

  // ==========================================
  // RENDER
  // ==========================================
  if (loadingClasses) return <Spinner />;

  return (
    <div className="p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold text-green-700">
          <i className="bi bi-bar-chart-fill me-2 text-green-600"></i>
          Class Performance Overview
        </h3>
        <p className="text-sm text-gray-500 mt-1">Select Class → Select View → Review performance & rankings.</p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button onClick={loadAllClasses} className="ml-3 text-amber-800 underline text-sm">Retry</button>
        </div>
      )}

      {/* SELECTORS */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <i className="bi bi-building me-1"></i> Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={handleClassChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 text-sm"
          >
            <option value="">-- Choose a Class --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <i className="bi bi-table me-1"></i> Select View
          </label>
          <select
            value={selectedMode}
            onChange={handleModeChange}
            disabled={!selectedClassId || loadingSubjects}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Choose View --</option>
            <option value="overall">📊 All Subjects Performance</option>
            {loadingSubjects ? (
              <option disabled>Loading subjects...</option>
            ) : (
              subjects.map(s => (
                <option key={s.id} value={s.id}>📘 {s.name}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* RESULTS + PRINT BUTTON */}
      {selectedMode && (
        <div>
          {/* Print Button — appears ONLY after results are loaded */}
          {!loadingResults && results.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-sm"
              >
                <i className="bi bi-printer"></i> Print Results
              </button>
            </div>
          )}

          <h4 className="text-base md:text-lg font-semibold text-green-700 mb-3 md:mb-4">
            <i className="bi bi-award me-2 text-green-600"></i>
            {selectedClassName} — {selectedMode === "overall"
              ? "📊 Performance Overview"
              : subjects.find(s => String(s.id) === String(selectedMode))?.name}
          </h4>

          <div ref={printRef}> {/* ← PRINT AREA WRAPPER */}
            {loadingResults ? (
              <Spinner />
            ) : results.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4">
                <i className="bi bi-info-circle me-2"></i>
                {error ? "Resolve permission issue above to view data." : "No results found. Marks may not have been entered yet."}
              </div>
            ) : selectedMode === "overall" ? (
              // OVERALL TABLE
              <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="bg-green-600 text-white">
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
                        <td className="px-1 py-2 md:px-2 md:py-2.5 font-medium text-gray-800 text-left">
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
                        <td className="px-1 py-2 md:px-2 md:py-2.5 text-center font-bold text-green-600">{row.position}</td>
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
                    <tr className="bg-green-600 text-white">
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
                        <td className="px-2 py-2 md:px-3 md:py-2.5 font-medium text-gray-800 text-left">
                          {row.studentName.split(" ")[0]}
                        </td>
                        <td className="px-2 py-2 md:px-3 md:py-2.5 text-center font-bold text-gray-800">
                          {row.marks !== null ? row.marks : "—"}
                        </td>
                        <td className="px-2 py-2 md:px-3 md:py-2.5 text-center font-bold text-green-600">{row.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorClassPerformance;