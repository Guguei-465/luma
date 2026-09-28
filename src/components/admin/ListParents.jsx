import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const parentTabs = [
  { to: "/admin-dashboard/parents", end: true, icon: "bi bi-list-ul", label: "Parents List" },
  { to: "/admin-dashboard/parents/add", icon: "bi bi-person-plus-fill", label: "Add Parent" },
];

const ListParents = () => {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchParents = async () => {
    try {
      const { data } = await api.get("accounts/users/?role=PARENT");
      const list = Array.isArray(data) ? data : (data.results || []);
      setParents(list.filter(p => (p.role || "").toUpperCase() === "PARENT"));
    } catch { toast.error("Failed to load parents"); }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get("students/");
      const list = Array.isArray(data) ? data : (data.results || []);
      setStudents(list);
    } catch { /* silent fail */ }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchParents(), fetchStudents()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  // Get children for a specific parent
  const getChildren = (parent) => {
    const fullName = `${parent.first_name} ${parent.last_name}`.trim().toLowerCase();
    return students.filter(s => {
      if (s.parent_name) {
        return s.parent_name.toLowerCase().trim() === fullName;
      }
      if (s.parent && parent.id) {
        return Number(s.parent) === Number(parent.id);
      }
      return false;
    });
  };

  const filtered = parents.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const term = search.toLowerCase();
    return fullName.includes(term) || (p.phone_number && String(p.phone_number).includes(search));
  });

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete parent ${name}?`)) return;
    try {
      await api.delete(`accounts/users/${id}/delete/`);
      toast.success("Parent deleted");
      fetchParents();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Parent / Guardian Management</h2>
        <p className="text-gray-500 mt-1">View and manage all parent & guardian accounts</p>
      </div>

      <AdminSubNav items={parentTabs} title="Parent Records" />

      <div className="flex flex-col md:flex-row justify-between gap-3 mb-5">
        <input 
          type="text" 
          placeholder="Search name / phone..." 
          className="milk-input md:max-w-sm" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <button onClick={() => navigate("/admin-dashboard/parents/add")} className="milk-btn whitespace-nowrap">
          + Add New Parent
        </button>
      </div>

      {loading && <p>Loading parents...</p>}
      
      {!loading && filtered.length === 0 && (
        <p className="text-gray-500">{search ? "No matches" : "No parents registered"}</p>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const children = getChildren(p);
            const childCount = children.length;
            return (
              <div key={p.id} className="card p-4">
                <h3 className="font-bold text-lg">{p.first_name} {p.last_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{p.phone_number}</p>
                <p className="text-sm text-gray-600">{p.email || "No email"}</p>
                
                {/* ✅ CLICKABLE LINK — goes to children list */}
                <button
                  onClick={() => navigate(`/admin-dashboard/parents/${p.id}/children`, { state: { parent: p, children } })}
                  className="text-sm font-medium text-teal-600 hover:text-teal-800 hover:underline mt-2 text-left"
                >
                  {childCount} linked student{childCount !== 1 ? "s" : ""}
                </button>

                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate(`/admin-dashboard/parents/edit/${p.id}`)} className="flex-1 bg-blue-500 text-white py-1 rounded">Edit</button>
                  <button onClick={() => handleDelete(p.id, p.first_name)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListParents;