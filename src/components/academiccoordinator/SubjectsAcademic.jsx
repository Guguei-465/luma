import { useEffect, useState } from "react";
import api from "../api/api";

const SubjectsAcademic = () => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", code: "", description: "" });

  useEffect(() => { 
    fetchSubjects(); 
  }, []);

  useEffect(() => {
    const results = subjects.filter(
      (s) => 
        s.name?.toLowerCase().includes(search.toLowerCase()) || 
        s.code?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredSubjects(results);
  }, [search, subjects]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get("subjects/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setSubjects(data);
      setFilteredSubjects(data);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(false);
    setFormData({ id: "", name: "", code: "", description: "" });
    setShowModal(true);
  };

  const openEditModal = (subject) => {
    setEditing(true);
    setFormData({ ...subject });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`subjects/update/${formData.id}/`, formData);
      } else {
        await api.post("subjects/create/", formData);
      }
      fetchSubjects();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving subject:", err.response?.data || err);
      alert("Failed to save subject. Check your input!");
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject? This action cannot be undone!")) return;
    try {
      await api.delete(`subjects/delete/${id}/`);
      fetchSubjects();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete subject — may be in use!");
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">School Subjects</h2>
          <p className="text-gray-500 mt-1">Create, view, edit and manage all taught subjects</p>
        </div>
        <button 
          onClick={openAddModal} 
          className="milk-btn flex items-center gap-2 w-fit"
        >
          <i className="bi bi-plus-circle-fill"></i> Add New Subject
        </button>
      </div>

      {/* Search Bar — uses card + milk-input */}
      <div className="card">
        <div className="relative max-w-md">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Search by name or subject code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="milk-input pl-10"
          />
        </div>
      </div>

      {/* Subjects Table — wrapped in card */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <i className="bi bi-arrow-repeat animate-spin text-2xl mb-2"></i>
            <p>Loading subjects...</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-green-200">
                <th className="px-4 py-3 text-left text-green-700 font-semibold">Subject Code</th>
                <th className="px-4 py-3 text-left text-green-700 font-semibold">Subject Name</th>
                <th className="px-4 py-3 text-left text-green-700 font-semibold">Description</th>
                <th className="px-4 py-3 text-center text-green-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">
                    {search ? "No subjects match your search." : "No subjects added yet."}
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-gray-700">{subject.code}</td>
                    <td className="px-4 py-4 font-semibold text-gray-800">{subject.name}</td>
                    <td className="px-4 py-4 text-gray-600 max-w-xs truncate">{subject.description || "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-5">
                        <button 
                          onClick={() => openEditModal(subject)} 
                          className="text-green-600 hover:text-green-800 transition-colors text-lg"
                          title="Edit Subject"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button 
                          onClick={() => deleteSubject(subject.id)} 
                          className="text-red-600 hover:text-red-800 transition-colors text-lg"
                          title="Delete Subject"
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal — styled consistently */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-green-200 px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editing ? "Edit Subject Details" : "Register New Subject"}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <i className="bi bi-x-circle-fill text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="form-lable">Subject Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className="milk-input"
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div>
                <label className="form-lable">Subject Code <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="code" 
                  value={formData.code} 
                  onChange={handleChange} 
                  required 
                  className="milk-input"
                  placeholder="e.g., MATH-101"
                />
              </div>

              <div>
                <label className="form-lable">Brief Description</label>
                <textarea 
                  rows="4" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  className="milk-input"
                  placeholder="Short summary of what this subject covers..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="milk-btn px-6"
                >
                  {editing ? "Update Subject" : "Save Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsAcademic;