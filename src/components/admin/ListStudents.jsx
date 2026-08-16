import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const studentTabs = [
  { to: "/admin-dashboard/students", end: true, icon: "bi bi-list-ul", label: "Students List" },
  { to: "/admin-dashboard/students/add", icon: "bi bi-person-plus-fill", label: "Register Student" },
];

const ListStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // search filter
  const navigate = useNavigate();

  // ── Load all students ──
  const fetchStudents = async () => {
    try {
      const { data } = await api.get("students/");
      setStudents(data);
    } catch {
      toast.error("Failed to load student list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ── Search filter logic ──
  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(search.toLowerCase()) ||
    s.current_class.toLowerCase().includes(search.toLowerCase())
  );

  // ── Delete student ──
const handleDelete = async (id, fullName) => {
    if (!window.confirm(`Permanently delete ${fullName}?`)) return;
    try {
      await api.delete(`students/delete/${id}/`);
      toast.success("Student deleted successfully");
      fetchStudents(); // refresh list
    } catch {
      toast.error("Delete failed — student may have linked records");
    }
  };

  // ✅ TRANSFER: Change Class / Stream
  const handleTransferClass = async (student) => {
    const newClass = prompt(`Enter NEW class for ${student.first_name} ${student.last_name}:\nCurrent: ${student.current_class}`);
    if (!newClass || newClass.trim() === student.current_class) return;

    const newStream = prompt(`Enter NEW stream (leave blank to keep: ${student.stream || "None"}):`);

    try {
await api.patch(`students/update/${student.id}/`, {
        current_class: newClass.trim(),
        stream: newStream?.trim() || student.stream,
        notes: `${student.notes || ""}\n[${new Date().toLocaleDateString()}] Transferred to Class ${newClass}`
      });
      toast.success(`✅ Student moved to ${newClass} ${newStream || ""}`);
      fetchStudents();
    } catch {
      toast.error("❌ Failed to transfer class");
    }
  };

  // ✅ TRANSFER: Move to Another School
  const handleTransferSchool = async (student) => {
    const newSchool = prompt(`Enter FULL NAME of NEW school for ${student.first_name} ${student.last_name}:`);
    if (!newSchool) return;

    const confirm = window.confirm(`Transfer ${student.first_name} to:\n"${newSchool}"?\nThis will mark them inactive in current school.`);
    if (!confirm) return;

    try {
await api.patch(`students/update/${student.id}/`, {
        school_name: newSchool,
        is_active: false, // no longer active here
        notes: `${student.notes || ""}\n[${new Date().toLocaleDateString()}] TRANSFERRED TO: ${newSchool}`
      });
      toast.success(`✅ Student transferred to ${newSchool}`);
      fetchStudents();
    } catch {
      toast.error("❌ Transfer failed");
    }
  };

  // ── Status badge helper ──
  const StatusBadge = ({ active }) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}>
      {active ? "Active" : "Transferred/Inactive"}
    </span>
  );

return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Student Management</h2>
        <p className="text-gray-500 mt-1">Register, manage and track all student records</p>
      </div>

      <AdminSubNav items={studentTabs} title="Student Records" />

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-5">
        <input
          type="text"
          placeholder="Search name / admission / class..."
          className="milk-input md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => navigate("/admin-dashboard/students/add")}
          className="milk-btn whitespace-nowrap">
          + Register New Student
        </button>
      </div>

      {/* Loading / Empty States */}
      {loading && <p className="text-gray-500">Loading student records...</p>}
      {!loading && filteredStudents.length === 0 && (
        <p className="text-gray-500">
          {search ? "No students match your search" : "No students registered yet"}
        </p>
      )}

      {/* ── DESKTOP: Full Table ── */}
      {filteredStudents.length > 0 && (
        <div>
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="p-3 text-left">Student Name</th>
                  <th className="p-3 text-left">Admission No.</th>
                  <th className="p-3 text-left">Current Class</th>
                  <th className="p-3 text-left">School</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{s.first_name} {s.last_name}</td>
                    <td className="p-3">{s.admission_number}</td>
                    <td className="p-3">{s.current_class} {s.stream && `(${s.stream})`}</td>
                    <td className="p-3 text-sm">{s.school_name || "Current School"}</td>
                    <td className="p-3"><StatusBadge active={s.is_active} /></td>
                    <td className="p-3 space-x-2 text-xs">
                      <button
                        onClick={() => navigate(`/admin-dashboard/students/edit/${s.id}`)}
                        className="bg-blue-500 text-white px-2 py-1 rounded">
                        Edit
                      </button>
                      <button
                        onClick={() => handleTransferClass(s)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded">
                        Transfer Class
                      </button>
                      <button
                        onClick={() => handleTransferSchool(s)}
                        className="bg-purple-500 text-white px-2 py-1 rounded">
                        Transfer School
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                        className="bg-red-500 text-white px-2 py-1 rounded">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE: Compact Cards ── */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map(s => (
              <div key={s.id} className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{s.first_name} {s.last_name}</h3>
                  <StatusBadge active={s.is_active} />
                </div>
                <div className="text-sm space-y-1 mb-3">
                  <p><span className="text-gray-500">Admission:</span> {s.admission_number}</p>
                  <p><span className="text-gray-500">Class:</span> {s.current_class} {s.stream && `(${s.stream})`}</p>
                  <p><span className="text-gray-500">School:</span> {s.school_name || "Current School"}</p>
                  {s.parent_name && <p><span className="text-gray-500">Parent:</span> {s.parent_name}</p>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => navigate(`/admin-dashboard/students/edit/${s.id}`)}
                    className="bg-blue-500 text-white px-2 py-1 rounded">
                    Edit
                  </button>
                  <button
                    onClick={() => handleTransferClass(s)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded">
                    Transfer Class
                  </button>
                  <button
                    onClick={() => handleTransferSchool(s)}
                    className="bg-purple-500 text-white px-2 py-1 rounded">
                    Transfer School
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                    className="bg-red-500 text-white px-2 py-1 rounded ml-auto">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListStudents;