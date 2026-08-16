import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const teacherTabs = [
  { to: "/admin-dashboard/teachers", end: true, icon: "bi bi-list-ul", label: "Teachers List" },
  { to: "/admin-dashboard/teachers/add", icon: "bi bi-person-plus-fill", label: "Add Teacher" },
];

const ListTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

const fetchTeachers = async () => {
    try {
      const { data } = await api.get("accounts/users/?role=TEACHER");
      const list = Array.isArray(data) ? data : (data.results || []);
      setTeachers(list.filter(t => (t.role || "").toUpperCase() === "TEACHER"));
    } catch {
      toast.error("Failed to load teachers list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const filtered = teachers.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    t.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject_specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher ${name}?`)) return;
    try {
await api.delete(`accounts/users/${id}/delete/`);
      toast.success("Teacher deleted successfully");
      fetchTeachers();
    } catch {
      toast.error("Delete failed");
    }
  };

  const StatusBadge = ({ active }) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );

return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Teacher Management</h2>
        <p className="text-gray-500 mt-1">Register, assign and manage all teaching staff</p>
      </div>

      <AdminSubNav items={teacherTabs} title="Teaching Staff" />

      <div className="flex flex-col md:flex-row justify-between gap-3 mb-5">
        <input
          type="text" placeholder="Search name / ID / subject..."
          className="milk-input md:max-w-sm" value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => navigate("/admin-dashboard/teachers/add")} className="milk-btn whitespace-nowrap">
          + Add New Teacher
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading teachers...</p>}
      {!loading && filtered.length === 0 && <p className="text-gray-500">{search ? "No matches found" : "No teachers registered yet"}</p>}

      {filtered.length > 0 && (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="p-3 text-left">Full Name</th>
                  <th className="p-3 text-left">Employee ID</th>
                  <th className="p-3 text-left">Specialty / Subject</th>
                  <th className="p-3 text-left">Contact</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{t.first_name} {t.last_name}</td>
                    <td className="p-3">{t.employee_id}</td>
                    <td className="p-3">{t.subject_specialty || "Not assigned"}</td>
                    <td className="p-3">{t.phone_number}<br />{t.email}</td>
                    <td className="p-3"><StatusBadge active={t.is_active} /></td>
                    <td className="p-3 space-x-2 text-xs">
                      <button onClick={() => navigate(`/admin-dashboard/teachers/edit/${t.id}`)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                      <button onClick={() => handleDelete(t.id, `${t.first_name}`)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(t => (
              <div key={t.id} className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{t.first_name} {t.last_name}</h3>
                  <StatusBadge active={t.is_active} />
                </div>
                <div className="text-sm space-y-1 mb-3">
                  <p><span className="text-gray-500">ID:</span> {t.employee_id}</p>
                  <p><span className="text-gray-500">Subject:</span> {t.subject_specialty || "Unassigned"}</p>
                  <p><span className="text-gray-500">Phone:</span> {t.phone_number}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => navigate(`/admin-dashboard/teachers/edit/${t.id}`)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                  <button onClick={() => handleDelete(t.id, t.first_name)} className="bg-red-500 text-white px-2 py-1 rounded ml-auto">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListTeachers;