import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/api";

const AdminUserList = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Fetch every CustomUser from Django backend
const fetchAllUsers = async () => {
    try {
      const { data } = await api.get("accounts/users/"); // matches your CustomUser endpoint
      setAllUsers(data);
    } catch (err) {
      toast.error("❌ Failed to load registered users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Filter: search name/email + role filter
  const filteredUsers = allUsers.filter(user => {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Status badge
  const StatusBadge = ({ is_active }) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}>
      {is_active ? "Active" : "Inactive"}
    </span>
  );

  // Role badge
  const RoleBadge = ({ role }) => (
    <span className="px-2 py-1 rounded text-xs font-medium bg-teal-100 text-teal-700 capitalize">
      {role}
    </span>
  );

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">All Registered System Users</h2>
        <p className="text-gray-500 text-sm">View every user across all roles in one place</p>
      </div>

      {/* Search & Role Filter */}
      <div className="card p-4 mb-5 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="milk-input flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="milk-input md:w-48"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {/* Loading / Empty State */}
      {loading && <p className="p-4 text-gray-500">Loading users...</p>}
      {!loading && filteredUsers.length === 0 && (
        <p className="p-4 text-gray-500">
          {searchTerm || filterRole !== "all" ? "No matching users found" : "No registered users yet"}
        </p>
      )}

      {/* Read-Only Users Table */}
      {!loading && filteredUsers.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Full Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-medium">
                    {user.first_name || ""} {user.last_name || ""}
                    {!user.first_name && !user.last_name && <span className="text-gray-500">—</span>}
                  </td>
                  <td className="p-3">{user.email || <span className="text-gray-500">—</span>}</td>
                  <td className="p-3"><RoleBadge role={user.role} /></td>
                  <td className="p-3"><StatusBadge is_active={user.is_active} /></td>
                  <td className="p-3 text-xs text-gray-600">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString("en-KE") : "—"}
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

export default AdminUserList;