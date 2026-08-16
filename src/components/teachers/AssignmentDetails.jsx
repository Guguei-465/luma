import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";


const AssignmentDetails = () => {
    const { id } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAssignment = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/teacher/assignments/${id}/`);
            setAssignment(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignment();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center py-5">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4">
                Assignment not found.
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div>
                    <h2 className="font-bold text-lg mb-1">
                        {assignment.subject}
                    </h2>

                    <p className="text-gray-500 text-sm mb-2">
                        {assignment.grade} • {assignment.stream}
                    </p>

                    <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            assignment.class_teacher
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {assignment.class_teacher
                            ? "Class Teacher"
                            : "Subject Teacher"}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button className="border border-blue-600 text-blue-600 rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition" onClick={fetchAssignment}>
                        <i className="bi bi-arrow-clockwise mr-2"></i>
                        Refresh
                    </button>

                    <button className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition">
                        <i className="bi bi-download mr-2"></i>
                        Export
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <i className="bi bi-people-fill text-blue-600 text-2xl"></i>
                    <h3 className="font-bold text-lg mt-2">
                        {assignment.students}
                    </h3>
                    <span className="text-xs text-gray-500">
                        Students
                    </span>
                </div>

                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <i className="bi bi-journal-check text-green-600 text-2xl"></i>
                    <h3 className="font-bold text-lg mt-2">
                        {assignment.assessments}
                    </h3>
                    <span className="text-xs text-gray-500">
                        Assessments
                    </span>
                </div>

                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <i className="bi bi-pencil-square text-yellow-600 text-2xl"></i>
                    <h3 className="font-bold text-lg mt-2">
                        {assignment.pendingResults}
                    </h3>
                    <span className="text-xs text-gray-500">
                        Pending Results
                    </span>
                </div>

                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <i className="bi bi-calendar-check-fill text-blue-400 text-2xl"></i>
                    <h5 className="font-bold text-sm mt-2">
                        {assignment.attendanceToday
                            ? "Completed"
                            : "Pending"}
                    </h5>
                    <span className="text-xs text-gray-500">
                        Attendance
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-xl shadow">
                    <div className="p-4 text-center">
                        <i className="bi bi-people text-blue-600 text-3xl"></i>
                        <h5 className="mt-2 font-bold text-sm">Students</h5>                       
                        <p className="text-gray-500 text-xs mt-1">
                            View all learners in this class.
                        </p>
                        <Link
                            to={`/teacher/assignments/${assignment.id}/students`}
                            className="block mt-3 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition"
                        >
                            Open
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow">
                    <div className="p-4 text-center">
                        <i className="bi bi-journal-plus text-green-600 text-3xl"></i>
                        <h5 className="mt-2 font-bold text-sm">Assessments</h5>
                        <p className="text-gray-500 text-xs mt-1">
                            Create and manage assessments.
                        </p>
                        <Link
                            to={`/teacher/assessments`}
                            className="block mt-3 bg-green-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-700 transition"
                        >
                            Open
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow">
                    <div className="p-4 text-center">
                        <i className="bi bi-bar-chart-line text-blue-400 text-3xl"></i>
                        <h5 className="mt-2 font-bold text-sm">Results</h5>
                        <p className="text-gray-500 text-xs mt-1">
                            View and submit learner results.
                        </p>
                        <Link
                            to={`/teacher/results`}
                            className="block mt-3 bg-blue-400 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-500 transition"
                        >
                            Open
                        </Link>
                    </div>
                </div>

                {assignment.class_teacher && (
                    <div className="bg-white rounded-xl shadow">
                        <div className="p-4 text-center">
                            <i className="bi bi-calendar-check text-yellow-500 text-3xl"></i>
                            <h5 className="mt-2 font-bold text-sm">Attendance</h5>
                            <p className="text-gray-500 text-xs mt-1">
                                Record today's attendance.
                            </p>
                            <Link
                                to={`/teacher/attendance/${assignment.id}`}
                                className="block mt-3 bg-yellow-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-yellow-600 transition"
                            >
                                <i className="bi bi-calendar-check-fill mr-2"></i>
                                Open
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow">
                <div className="border-b px-6 py-4">
                    <h5 className="font-bold text-sm">Recent Activity</h5>
                </div>

                <div className="p-4">
                    <ul className="divide-y divide-gray-200">
                        <li className="py-3 text-sm text-gray-600">
                            CAT 2 Mathematics assessment created.
                        </li>
                        <li className="py-3 text-sm text-gray-600">
                             Results submitted for Week 5 assessment.
                        </li>
                        <li className="py-3 text-sm text-gray-600">
                            Attendance marked successfully.
                        </li>
                        <li className="py-3 text-sm text-gray-600">
                            Grade report generated.
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
};

export default AssignmentDetails;

