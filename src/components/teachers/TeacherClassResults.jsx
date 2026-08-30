import { useEffect, useState, useCallback } from "react";
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
  return isNaN(n) || val === "" ? 0 : n;
};


// =====================================================
// MAIN COMPONENT
// =====================================================
const TeacherClassResults = () => {
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClassName, setSelectedClassName] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [selectedAssessmentName, setSelectedAssessmentName] = useState("");
  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");


  // ==========================================
  // LOAD TEACHER'S CLASSES
  // ==========================================
  const loadClasses = useCallback(async () => {
    const endpointsToTry = [
      "assignments/teacher-assignments/",
      "dashboard/teacher/assignments/",
    ];

    for (const endpoint of endpointsToTry) {
      try {
        setLoadingClasses(true);
        setError("");
        console.log("📤 Trying endpoint:", endpoint);

        const res = await api.get(endpoint);
        console.log("✅ Response from", endpoint, ":", res.data);

        const assignments = getArray(res.data);
        if (!assignments || assignments.length === 0) {
          console.log("⚠️ No assignments from:", endpoint);
          continue;
        }

        const unique = [];
        const seen = new Set();
        assignments.forEach(a => {
          const cid = a.classroom_id || a.classroom;
          const cname = a.classroom_name || `${a.grade || ""} ${a.stream || ""}`.trim();
          if (cid && !seen.has(cid)) {
            seen.add(cid);
            unique.push({ id: cid, name: cname });
          }
        });

        console.log("✅ Unique classes list:", unique);
        setClasses(unique);
        return; // Success — stop trying

      } catch (err) {
        console.error("❌ Failed:", endpoint, "Status:", err.response?.status);
      }
    }

    setError("Failed to load classes.");
  }, []);


  // ==========================================
  // LOAD ASSESSMENTS FOR SELECTED CLASS
  // ==========================================
  const loadAssessments = useCallback(async (classId) => {
    if (!classId) {
      setAssessments([]);
      setSelectedAssessmentId("");
      setSelectedAssessmentName("");
      setResults([]);
      setSubjects([]);
      return;
    }

    try {
      setLoadingAssessments(true);
      setError("");
      setSelectedAssessmentId("");
      setSelectedAssessmentName("");
      setResults([]);
      setSubjects([]);

      const url = `assessments/?classroom=${classId}`;
      console.log("📤 Loading assessments:", url);
      const res = await api.get(url);
      const assessmentList = getArray(res.data);
      console.log("✅ Assessments loaded:", assessmentList);
      setAssessments(assessmentList);

    } catch (err) {
      console.error("❌ Load assessments failed:", err.response?.status);
      setError("Failed to load assessments.");
    } finally {
      setLoadingAssessments(false);
    }
  }, []);


  // ==========================================
  // LOAD RESULTS & BUILD TABLE
  // ==========================================
  const loadResults = useCallback(async (classId, assessmentId) => {
    if (!classId || !assessmentId) return;

    try {
      setLoadingResults(true);
      setError("");
      setResults([]);
      setSubjects([]);

      // 1. Load students in class
      console.log("📤 Loading students for class:", classId);
      const studentsRes = await api.get(`students/?classroom=${classId}`);
      const students = getArray(studentsRes.data);
      console.log("✅ Students loaded:", students);

      // 2. Load results for this assessment
      console.log("📤 Loading results for assessment:", assessmentId);
      const resultsRes = await api.get(`results/results/?assessment=${assessmentId}`);
      const rawResults = getArray(resultsRes.data);
      console.log("✅ Raw results loaded:", rawResults);

      // 3. Extract unique subjects
      const subjectSet = new Set();
      rawResults.forEach(r => {
        if (r.subject_name) subjectSet.add(r.subject_name);
      });
      const subjectList = Array.from(subjectSet).sort();
      console.log("✅ Subjects found:", subjectList);
      setSubjects(subjectList);

      // 4. Organize marks by student
      const studentMarks = {};
      rawResults.forEach(r => {
        const sid = r.student || r.student_id;
        if (!studentMarks[sid]) {
          studentMarks[sid] = {
            studentId: sid,
            studentName: r.student_name || "Unknown Student",
            admissionNumber: r.admission_number || "",
            marks: {},
            total: 0,
          };
        }
        const mark = safeNumber(r.marks || r.score);
        studentMarks[sid].marks[r.subject_name] = mark;
        studentMarks[sid].total += mark;
      });

      // 5. Add students with NO results yet
      students.forEach(s => {
        const sid = s.id;
        if (!studentMarks[sid]) {
          studentMarks[sid] = {
            studentId: sid,
            studentName: s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Unknown Student",
            admissionNumber: s.admission_number || "",
            marks: {},
            total: 0,
          };
        }
      });

      // 6. Sort by total (descending)
      let tableData = Object.values(studentMarks);
      tableData.sort((a, b) => b.total - a.total);

      // 7. Calculate positions (handles ties correctly)
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

      // 8. Calculate averages
      tableData.forEach(row => {
        row.average = subjectList.length > 0
          ? (row.total / subjectList.length).toFixed(2)
          : "0.00";
      });

      console.log("✅ Final table data:", tableData);
      setResults(tableData);

    } catch (err) {
      console.error("❌ Load results failed:", err.response?.status, err.response?.data);
      setError("Failed to load results.");
    } finally {
      setLoadingResults(false);
    }
  }, []);


  // ==========================================
  // DROPDOWN HANDLERS
  // ==========================================
  const handleClassChange = (e) => {
    const cid = e.target.value;
    setSelectedClassId(cid);
    const cls = classes.find(c => String(c.id) === String(cid));
    setSelectedClassName(cls?.name || "");
    setSelectedAssessmentId("");
    setSelectedAssessmentName("");
    setResults([]);
    setSubjects([]);
    if (cid) loadAssessments(cid);
  };


  const handleAssessmentChange = (e) => {
    const aid = e.target.value;
    setSelectedAssessmentId(aid);
    const ass = assessments.find(a => String(a.id) === String(aid));
    setSelectedAssessmentName(
      ass ? `${ass.assessment_type || "Assessment"} — ${ass.subject_name || ""}`.trim() : ""
    );
    setResults([]);
    setSubjects([]);
    if (selectedClassId && aid) loadResults(selectedClassId, aid);
  };


  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);


  // ==========================================
  // RENDER
  // ==========================================
  if (loadingClasses) return <Spinner />;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800">📊 Class Results Summary</h3>
        <p className="text-sm text-gray-500 mt-1">Select Class → Select Assessment → View marks & rankings.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
          {error}
          <button onClick={loadClasses} className="ml-3 text-red-700 underline text-sm">Retry</button>
        </div>
      )}

      {/* SELECTORS */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">1. Select Class</label>
          <select
            value={selectedClassId}
            onChange={handleClassChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800"
          >
            <option value="">-- Choose a Class --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">2. Select Assessment / Exam</label>
          <select
            value={selectedAssessmentId}
            onChange={handleAssessmentChange}
            disabled={!selectedClassId || loadingAssessments}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Choose Assessment --</option>
            {loadingAssessments ? (
              <option disabled>Loading assessments...</option>
            ) : (
              assessments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.assessment_type || "Assessment"}
                  {a.subject_name && ` — ${a.subject_name}`}
                  {a.academic_year && ` (${a.academic_year})`}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* RESULTS TABLE */}
      {selectedAssessmentId && (
        <div>
          <h4 className="text-lg font-semibold text-gray-700 mb-4">
            {selectedClassName} — {selectedAssessmentName}
          </h4>

          {loadingResults ? (
            <Spinner />
          ) : results.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4">
              No results found. Marks may not have been entered yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="px-2 py-3 text-center font-medium">#</th>
                    <th className="px-3 py-3 text-left font-medium">Student Name</th>
                    {subjects.map(sub => (
                      <th key={sub} className="px-2 py-3 text-center font-medium whitespace-nowrap">
                        {sub}
                      </th>
                    ))}
                    <th className="px-2 py-3 text-center font-medium">Total</th>
                    <th className="px-2 py-3 text-center font-medium">Avg</th>
                    <th className="px-2 py-3 text-center font-medium">Pos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((row, idx) => (
                    <tr key={row.studentId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-2 py-2 text-center font-medium text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {row.studentName}
                        {row.admissionNumber && (
                          <span className="text-xs text-gray-400 ml-1">({row.admissionNumber})</span>
                        )}
                      </td>
                      {subjects.map(sub => (
                        <td key={sub} className="px-2 py-2 text-center text-gray-700">
                          {row.marks[sub] ?? "-"}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center font-bold text-gray-800">{row.total}</td>
                      <td className="px-2 py-2 text-center text-gray-600">{row.average}</td>
                      <td className="px-2 py-2 text-center font-bold text-green-700">{row.position}</td>
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