import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const examTabs = [
  { to: "/admin-dashboard/exams", end: true, icon: "bi bi-pencil-square", label: "Exams & Tests" },
  { to: "/admin-dashboard/exams/add", icon: "bi bi-file-earmark-plus", label: "Create Exam" },
];

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchExams = async () => {
    try {
      const { data } = await api.get("exams/");
      setExams(data);
    } catch { toast.error("Failed to load exams"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExams(); }, []);

  const filtered = exams.filter(e =>
    e.exam_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.term?.toLowerCase().includes(search.toLowerCase()) ||
    e.academic_year?.toString().includes(search)
  );

  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
    }`}>{status}</span>
  );

return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Examinations & Tests</h2>
        <p className="text-gray-500 mt-1">Create exams, enter marks and track results</p>
      </div>

      <AdminSubNav items={examTabs} title="Exams Overview" />

      <div className="flex flex-col md:flex-row justify-between gap-3 mb-5">
        <input type="text" placeholder="Search exam / term..." className="milk-input md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => navigate("/admin-dashboard/exams/add")} className="milk-btn whitespace-nowrap">+ Create New Exam</button>
      </div>

      {loading && <p className="text-gray-500">Loading exams...</p>}
      {!loading && filtered.length === 0 && <p className="text-gray-500">{search ? "No matching exams" : "No exams created yet"}</p>}

      {filtered.length > 0 && (
        <div className="hidden md:block card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="p-3 text-left">Exam Name</th>
                <th className="p-3 text-left">Term / Year</th>
                <th className="p-3 text-left">Classes</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(exam => (
                <tr key={exam.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{exam.exam_name}</td>
                  <td className="p-3">{exam.term} • {exam.academic_year}</td>
                  <td className="p-3">{exam.target_classes || "All"}</td>
                  <td className="p-3"><StatusBadge status={exam.status} /></td>
                  <td className="p-3 space-x-2 text-xs">
                    <button onClick={() => navigate(`/admin-dashboard/exams/marks-entry/${exam.id}`)} className="bg-teal-500 text-white px-2 py-1 rounded">Enter Marks</button>
                    <button onClick={() => navigate(`/admin-dashboard/exams/edit/${exam.id}`)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExamList;