import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const studentTabs = [
  { to: "/admin-dashboard/students", end: true, icon: "bi bi-list-ul", label: "Students List" },
  { to: "/admin-dashboard/students/add", icon: "bi bi-person-plus-fill", label: "Register Student" },
];

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

// ✅ Consistent color generator — same class always gets same color
const getClassColor = (className) => {
  if (!className) return "bg-gray-100 text-gray-700";
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
    "bg-red-100 text-red-700",
    "bg-teal-100 text-teal-700",
    "bg-orange-100 text-orange-700",
    "bg-cyan-100 text-cyan-700",
  ];
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    hash = className.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ListStudents = () => {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Transfer modal state
  const [transferTarget, setTransferTarget] = useState(null); // student being transferred
  const [transferClassroom, setTransferClassroom] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferring, setTransferring] = useState(false);

  // ── Load all students ──
  const fetchStudents = async () => {
    try {
      const { data } = await api.get("students/");
      setStudents(getArray(data));
    } catch {
      toast.error("Failed to load student list");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const { data } = await api.get("classes/");
      setClassrooms(getArray(data));
    } catch {
      // non-fatal, transfer dropdown will just be empty
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClassrooms();
  }, []);

  // ── Search filter logic (guards against missing fields) ──
  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    const admission = (s.admission_number || "").toLowerCase();
    const classroomName = (s.classroom_name || "").toLowerCase();
    return (
      name.includes(term) ||
      admission.includes(term) ||
      classroomName.includes(term)
    );
  });

  // ── Delete student ──
  const handleDelete = async (id, fullName) => {
    if (!window.confirm(`Permanently delete ${fullName}?`)) return;
    try {
      await api.delete(`students/delete/${id}/`);
      toast.success("Student deleted successfully");
      fetchStudents();
    } catch {
      toast.error("Delete failed — student may have linked records");
    }
  };

  // ── Mark as Transferred / Graduated (status only) ──
  const handleStatusChange = async (student, status) => {
    try {
      await api.patch(`students/update/${student.id}/`, { status });
      toast.success(`Status updated to ${status}`);
      fetchStudents();
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ── Open the "change class" flow ──
  const openTransfer = (student) => {
    setTransferTarget(student);
    setTransferClassroom("");
    setTransferReason("");
  };

  const submitTransfer = async () => {
    if (!transferTarget || !transferClassroom) return;

    if (String(transferClassroom) === String(transferTarget.classroom)) {
      toast.error("Choose a different class to transfer into.");
      return;
    }

    setTransferring(true);
    try {
      await api.post("students/transfer/", {
        student: transferTarget.id,
        from_classroom: transferTarget.classroom,
        to_classroom: transferClassroom,
        reason: transferReason,
      });
      toast.success(
        `${transferTarget.first_name} ${transferTarget.last_name} moved successfully.`
      );
      setTransferTarget(null);
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to transfer student";
      toast.error(msg);
    } finally {
      setTransferring(false);
    }
  };

  // ── Status badge helper ──
  const StatusBadge = ({ status }) => {
    const styles =
      status === "Active"
        ? "bg-green-100 text-green-700"
        : status === "Graduated"
        ? "bg-blue-100 text-blue-700"
        : "bg-yellow-100 text-yellow-700";
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles}`}>
        {status || "—"}
      </span>
    );
  };

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
                  <th className="p-3 text-left w-12">#</th>
                  <th className="p-3 text-left">Student Name</th>
                  <th className="p-3 text-left">Admission No.</th>
                  <th className="p-3 text-left">Class</th>
                  <th className="p-3 text-left">Parent</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, index) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-500">{index + 1}</td>
                    <td className="p-3 font-medium">{s.first_name} {s.last_name}</td>
                    <td className="p-3">{s.admission_number}</td>
                    <td className="p-3">
                      {s.classroom_name ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getClassColor(s.classroom_name)}`}>
                          {s.classroom_name}
                        </span>
                      ) : (
                        <span className="text-yellow-600">Not assigned</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">{s.parent_name || "—"}</td>
                    <td className="p-3"><StatusBadge status={s.status} /></td>
                    <td className="p-3 space-x-2 text-xs">
                      <button
                        onClick={() => navigate(`/admin-dashboard/students/edit/${s.id}`)}
                        className="bg-blue-500 text-white px-2 py-1 rounded">
                        Edit
                      </button>
                      <button
                        onClick={() => openTransfer(s)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded">
                        Change Class
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
            {filteredStudents.map((s, index) => (
              <div key={s.id} className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">
                    <span className="text-gray-400 mr-2">{index + 1}.</span>
                    {s.first_name} {s.last_name}
                  </h3>
                  <StatusBadge status={s.status} />
                </div>
                <div className="text-sm space-y-1 mb-3">
                  <p><span className="text-gray-500">Admission:</span> {s.admission_number}</p>
                  <p>
                    <span className="text-gray-500">Class:</span>{" "}
                    {s.classroom_name ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getClassColor(s.classroom_name)} ml-1`}>
                        {s.classroom_name}
                      </span>
                    ) : (
                      <span className="text-yellow-600 ml-1">Not assigned</span>
                    )}
                  </p>
                  {s.parent_name && <p><span className="text-gray-500">Parent:</span> {s.parent_name}</p>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => navigate(`/admin-dashboard/students/edit/${s.id}`)}
                    className="bg-blue-500 text-white px-2 py-1 rounded">
                    Edit
                  </button>
                  <button
                    onClick={() => openTransfer(s)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded">
                    Change Class
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

      {/* ── TRANSFER MODAL ── */}
      {transferTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">
              Change class for {transferTarget.first_name} {transferTarget.last_name}
            </h3>
            <p className="text-sm text-gray-500">
              Current class: {transferTarget.classroom_name || "Not assigned"}
            </p>

            <div>
              <label className="form-label">New Class *</label>
              <select
                className="milk-input"
                value={transferClassroom}
                onChange={(e) => setTransferClassroom(e.target.value)}
              >
                <option value="">Select a class</option>
                {classrooms
                  .filter((c) => String(c.id) !== String(transferTarget.classroom))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grade} {c.stream}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="form-label">Reason (optional)</label>
              <textarea
                className="milk-input resize-none"
                rows={2}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium flex-1"
                onClick={() => setTransferTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="milk-btn flex-1"
                disabled={!transferClassroom || transferring}
                onClick={submitTransfer}
              >
                {transferring ? "Moving..." : "Confirm Transfer"}
              </button>
            </div>

            <div className="border-t pt-3 flex justify-between text-xs text-gray-500">
              <button
                className="underline"
                onClick={() => {
                  handleStatusChange(transferTarget, "Graduated");
                  setTransferTarget(null);
                }}
              >
                Mark as Graduated instead
              </button>
              <button
                className="underline"
                onClick={() => {
                  handleStatusChange(transferTarget, "Transferred");
                  setTransferTarget(null);
                }}
              >
                Mark as Transferred (left school)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListStudents;