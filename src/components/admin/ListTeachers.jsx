import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const teacherTabs = [
  { to: "/admin-dashboard/teachers", end: true, icon: "bi bi-list-ul", label: "Teachers List" },
  { to: "/admin-dashboard/teachers/add", icon: "bi bi-person-plus-fill", label: "Add Teacher" },
];

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const ListTeachers = () => {
  // teacherProfiles come from accounts/teacher-profiles/ — nested { id, user: {...}, employee_number, ... }
  const [teacherProfiles, setTeacherProfiles] = useState([]);
  // assignments come from assignments/ — used only to show classes/subjects each teacher covers
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, assignmentsRes] = await Promise.allSettled([
        api.get("accounts/teacher-profiles/"),
        api.get("assignments/"),
      ]);

      if (profilesRes.status === "fulfilled") {
        setTeacherProfiles(getArray(profilesRes.value.data));
      } else {
        toast.error("Failed to load teachers list");
      }

      if (assignmentsRes.status === "fulfilled") {
        setAssignments(getArray(assignmentsRes.value.data));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Merge each teacher profile with its active classes/subjects
  const teachers = useMemo(() => {
    return teacherProfiles.map((t) => {
      const own = assignments.filter(
        (a) => String(a.teacher) === String(t.id) && a.is_active !== false
      );

      const classes = [
        ...new Map(
          own
            .filter((a) => a.classroom)
            .map((a) => [a.classroom, a.classroom_name || a.grade + " " + a.stream])
        ).values(),
      ];

      const subjects = [
        ...new Set(own.map((a) => a.subject_name).filter(Boolean)),
      ];

      return {
        id: t.id, // TeacherProfile id
        userId: t.user?.id,
        name: t.user
          ? `${t.user.first_name || ""} ${t.user.last_name || ""}`.trim() ||
            t.user.username
          : "Unknown Teacher",
        employeeNumber: t.employee_number || "—",
        email: t.user?.email || "",
        phone: t.user?.phone_number || "",
        isActive: t.user?.is_active ?? true,
        classes,
        subjects,
      };
    });
  }, [teacherProfiles, assignments]);

  const filtered = teachers.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.employeeNumber.toLowerCase().includes(term) ||
      t.subjects.join(" ").toLowerCase().includes(term)
    );
  });

  const handleDelete = async (userId, name) => {
    if (!userId) {
      toast.error("This teacher has no linked user account to delete.");
      return;
    }
    if (!window.confirm(`Delete teacher ${name}?`)) return;
    try {
      await api.delete(`accounts/users/${userId}/delete/`);
      toast.success("Teacher deleted successfully");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  const StatusBadge = ({ active }) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );

  const TagList = ({ items, emptyLabel, colorClass }) =>
    items.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className={`px-2 py-0.5 rounded text-xs ${colorClass}`}>
            {item}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-xs text-gray-400">{emptyLabel}</span>
    );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Teacher Management</h2>
        <p className="text-gray-500 mt-1">
          Register and manage teaching staff. Class and subject assignments are
          made by the Academic Coordinator.
        </p>
      </div>

      <AdminSubNav items={teacherTabs} title="Teaching Staff" />

      <div className="flex flex-col md:flex-row justify-between gap-3 mb-5">
        <input
          type="text" placeholder="Search name / employee no. / subject..."
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
                  <th className="p-3 text-left">Employee No.</th>
                  <th className="p-3 text-left">Classes</th>
                  <th className="p-3 text-left">Subjects</th>
                  <th className="p-3 text-left">Contact</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3">{t.employeeNumber}</td>
                    <td className="p-3"><TagList items={t.classes} emptyLabel="Not assigned" colorClass="bg-gray-100 text-gray-700" /></td>
                    <td className="p-3"><TagList items={t.subjects} emptyLabel="Not assigned" colorClass="bg-green-100 text-green-700" /></td>
                    <td className="p-3">{t.phone}<br />{t.email}</td>
                    <td className="p-3"><StatusBadge active={t.isActive} /></td>
                    <td className="p-3 space-x-2 text-xs whitespace-nowrap">
                      <button onClick={() => navigate(`/admin-dashboard/teachers/edit/${t.userId}`)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                      <button onClick={() => handleDelete(t.userId, t.name)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
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
                  <h3 className="font-bold text-lg">{t.name}</h3>
                  <StatusBadge active={t.isActive} />
                </div>
                <div className="text-sm space-y-1 mb-3">
                  <p><span className="text-gray-500">No:</span> {t.employeeNumber}</p>
                  <p><span className="text-gray-500">Phone:</span> {t.phone}</p>
                  <div className="pt-1">
                    <span className="text-gray-500 text-xs">Classes:</span>
                    <TagList items={t.classes} emptyLabel="Not assigned" colorClass="bg-gray-100 text-gray-700" />
                  </div>
                  <div className="pt-1">
                    <span className="text-gray-500 text-xs">Subjects:</span>
                    <TagList items={t.subjects} emptyLabel="Not assigned" colorClass="bg-green-100 text-green-700" />
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => navigate(`/admin-dashboard/teachers/edit/${t.userId}`)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                  <button onClick={() => handleDelete(t.userId, t.name)} className="bg-red-500 text-white px-2 py-1 rounded ml-auto">Delete</button>
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
