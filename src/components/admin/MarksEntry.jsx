import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const MarksEntry = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);

  // Grade helper function
  const getGrade = (score, max) => {
    const percent = (score/max)*100;
    if(percent >=80) return {grade:"A", remark:"Excellent"};
    if(percent >=70) return {grade:"B", remark:"Very Good"};
    if(percent >=60) return {grade:"C", remark:"Good"};
    if(percent >=50) return {grade:"D", remark:"Fair"};
    return {grade:"E", remark:"Needs Improvement"};
  };

useEffect(() => {
    if(!selectedClass || !selectedSubject) return;
    const loadStudents = async () => {
      try {
        const { data } = await api.get(`students/?current_class=${encodeURIComponent(selectedClass)}`);
        setStudents(data.map(s => ({
          ...s,
          marks: s.marks || 0,
          ...getGrade(s.marks || 0, 100)
        })));
      } catch { toast.error("Failed to load student list"); }
    };
    loadStudents();
  }, [selectedClass, selectedSubject, examId]);

  const handleMarkChange = (id, value) => {
    const numVal = Number(value);
    setStudents(prev => prev.map(s => {
      if(s.id === id) return {...s, marks: numVal, ...getGrade(numVal,100)};
      return s;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
await api.post("results/bulk", {
        submission: examId,
        results: students.map(s => ({
          student: s.id,
          marks: s.marks,
          remarks: s.remark || ""
        }))
      });
      toast.success("✅ Marks saved & graded successfully!");
    } catch { toast.error("Failed to save marks"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-5">
        <button onClick={() => navigate("/admin-dashboard/exams")} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
        <h2 className="text-2xl font-bold">Enter Exam Marks</h2>
      </div>

      <div className="card p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="form-label">Select Class *</label><select className="milk-input" value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)} required><option value="">-- Choose --</option><option value="Form 1">Form 1</option><option value="Form 2">Form 2</option></select></div>
          <div><label className="form-label">Select Subject *</label><select className="milk-input" value={selectedSubject} onChange={(e)=>setSelectedSubject(e.target.value)} required><option value="">-- Choose --</option><option value="Mathematics">Mathematics</option><option value="English">English</option><option value="Biology">Biology</option></select></div>
        </div>
      </div>

      {students.length>0 && (
        <form onSubmit={handleSubmit}>
          <div className="card overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead className="border-b text-gray-500">
                <tr><th className="p-3 text-left">Student</th><th className="p-3 text-center">Marks (/100)</th><th className="p-3 text-center">Grade</th><th className="p-3 text-left">Remarks</th></tr>
              </thead>
              <tbody>
                {students.map(s=>(
                  <tr key={s.id} className="border-b">
                    <td className="p-3 font-medium">{s.first_name} {s.last_name}</td>
                    <td className="p-3 text-center"><input type="number" min="0" max="100" className="milk-input w-20 text-center" value={s.marks} onChange={(e)=>handleMarkChange(s.id,e.target.value)} /></td>
                    <td className="p-3 text-center font-bold text-teal-600">{s.grade}</td>
                    <td className="p-3 text-gray-600">{s.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="submit" disabled={saving} className="milk-btn w-full max-w-md mx-auto block">{saving?"Saving...":"Save All Marks"}</button>
        </form>
      )}
    </div>
  );
};

export default MarksEntry;