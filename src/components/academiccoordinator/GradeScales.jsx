import { useEffect, useState } from "react";
import api from "../api/api";

const GradeScales = () => {
  const [gradeScales, setGradeScales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "", level: "", minimum_score: "", maximum_score: "", description: ""
  });

  const fetchGradeScales = async () => {
    try {
      const res = await api.get("results/grade-scales/");
      const data = res.data.results || res.data;
      setGradeScales(data);
      setFiltered(data);
    } catch (error) {
      console.error("Failed to load grade scales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGradeScales(); }, []);

  useEffect(() => {
    const data = gradeScales.filter((item) =>
      item.level?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(data);
  }, [search, gradeScales]);

  const openAddModal = () => {
    setEditing(false);
    setFormData({ id: "", level: "", minimum_score: "", maximum_score: "", description: "" });
    setShowModal(true);
  };

  const openEditModal = (scale) => {
    setEditing(true);
    setFormData({ ...scale });
    setShowModal(true);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editing
        ? await api.put(`results/grade-scales/${formData.id}/`, formData)
        : await api.post("results/grade-scales/", formData);
      fetchGradeScales();
      setShowModal(false);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Could not save grade scale!");
    }
  };

  const deleteScale = async (id) => {
    if (!window.confirm("Delete this grade scale?")) return;
    try {
      await api.delete(`results/grade-scales/${id}/`);
      fetchGradeScales();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6">
      {/* Header — Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Grade Scales</h2>
          <p className="text-gray-500 text-sm sm:text-base">Manage grading system used for student assessments</p>
        </div>
        <button onClick={openAddModal} className="milk-btn flex items-center gap-2 w-full sm:w-auto justify-center">
          <i className="bi bi-plus-circle-fill"></i> Add Grade Scale
        </button>
      </div>

      {/* Search — Full width on mobile */}
      <div className="card">
        <div className="relative w-full max-w-md">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Search grade level or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="milk-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Table — Responsive stacked cards on mobile */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-10 sm:py-16 text-gray-500">
            <i className="bi bi-arrow-repeat animate-spin text-2xl mb-2"></i>
            <p>Loading grade scales...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 sm:py-10 text-gray-500">
            {search ? "No matching grade scales found." : "No grade scales defined yet."}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b-2 border-green-200">
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold">Grade Level</th>
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold text-center">Min Score</th>
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold text-center">Max Score</th>
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold">Description</th>
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((grade) => (
                    <tr key={grade.id} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                      <td className="px-3 sm:px-4 py-3 font-semibold">{grade.level}</td>
                      <td className="px-3 sm:px-4 py-3 text-center">{grade.minimum_score}</td>
                      <td className="px-3 sm:px-4 py-3 text-center">{grade.maximum_score}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm">{grade.description || "—"}</td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <div className="flex justify-center gap-3 sm:gap-4">
                          <button onClick={() => openEditModal(grade)} className="text-green-600 hover:text-green-800 text-lg">
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button onClick={() => deleteScale(grade.id)} className="text-red-600 hover:text-red-800 text-lg">
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filtered.map((grade) => (
                <div key={grade.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-green-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg text-green-700">{grade.level}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(grade)} className="text-green-600 text-lg">
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button onClick={() => deleteScale(grade.id)} className="text-red-600 text-lg">
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div><span className="text-gray-500">Min:</span> <strong>{grade.minimum_score}</strong></div>
                    <div><span className="text-gray-500">Max:</span> <strong>{grade.maximum_score}</strong></div>
                  </div>
                  <p className="text-sm text-gray-600">{grade.description || "No description"}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal — Fully Responsive */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-green-200 px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-lg sm:text-xl font-semibold">{editing ? "Edit Grade Scale" : "Add New Grade Scale"}</h3>
              <button onClick={() => setShowModal(false)} className="text-red-500 hover:text-red-700">
                <i className="bi bi-x-circle-fill text-xl sm:text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="form-label">Grade Level <span className="text-red-500">*</span></label>
                <input type="text" name="level" value={formData.level} onChange={handleChange} required className="milk-input" placeholder="e.g. A, B, C" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Minimum Score <span className="text-red-500">*</span></label>
                  <input type="number" name="minimum_score" value={formData.minimum_score} onChange={handleChange} required className="milk-input" />
                </div>
                <div>
                  <label className="form-label">Maximum Score <span className="text-red-500">*</span></label>
                  <input type="number" name="maximum_score" value={formData.maximum_score} onChange={handleChange} required className="milk-input" />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="milk-input" placeholder="Brief meaning/performance level" />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 order-2 sm:order-1">Cancel</button>
                <button type="submit" className="milk-btn px-5 order-1 sm:order-2">{editing ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeScales;