import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const CoordinatorReports = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reportsList = [
    {
      id: "top-classes",
      title: "Top Performing Classes",
      desc: "Shows classes ranked by average academic performance.",
      endpoint: "dashboard/top-classes/",
      columns: [
        { key: "position", label: "Position" },
        { key: "classroom", label: "Class" },
        { key: "average_score", label: "Average Score" },
        { key: "total_students", label: "Students" },
      ],
    },
    {
      id: "students-by-class",
      title: "Students by Class",
      desc: "Shows the number of students currently enrolled in each class.",
      endpoint: "reports/students/by-class/",
      columns: [
        { key: "classroom", label: "Class" },
        { key: "total_students", label: "Total Students" },
      ],
    },
    {
      id: "class-capacity",
      title: "Class Capacity Report",
      desc: "Shows class capacity, current students and available spaces.",
      endpoint: "reports/school/class-capacity/",
      columns: [
        { key: "classroom", label: "Class" },
        { key: "capacity", label: "Capacity" },
        { key: "current_students", label: "Current Students" },
        { key: "available_spaces", label: "Available Spaces" },
      ],
    },
    {
      id: "teachers-by-class",
      title: "Teachers by Class",
      desc: "Shows the class teacher assigned to each classroom.",
      endpoint: "reports/teachers/by-class/",
      columns: [
        { key: "classroom", label: "Class" },
        { key: "class_teacher", label: "Class Teacher" },
      ],
    },
  ];

  const handleGenerate = async (report) => {
    setSelectedReport(report);
    setReportData([]);
    setError("");
    setLoading(true);
    try {
      const response = await api.get(report.endpoint);
      const data = response.data?.results || response.data || [];
      setReportData(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error(`Failed to load ${report.title}:`, err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        `Failed to load ${report.title}.`
      );
    } finally {
      setLoading(false);
    }
  };

  const closeReport = () => {
    setSelectedReport(null);
    setReportData([]);
    setError("");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Academic Reports</h1>
          <p className="text-gray-500 mt-2">Generate, preview and review structured academic reports and school summaries</p>
        </div>
        <button
          onClick={() => navigate("/academic-coordinator")}
          className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportsList.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xl flex-shrink-0">
                📊
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-800">{report.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{report.desc}</p>
              </div>
            </div>
            <button
              onClick={() => handleGenerate(report)}
              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              View Report
            </button>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-green-50 rounded-xl p-6 border border-green-100">
        <h3 className="font-semibold text-green-800 mb-2">Report Tips</h3>
        <ul className="text-gray-700 space-y-1 list-disc pl-5">
          <li>Use <strong>Top Performing Classes</strong> to compare academic performance between classes.</li>
          <li>Use <strong>Students by Class</strong> to monitor student distribution across classes.</li>
          <li>Use <strong>Class Capacity</strong> to identify classes with available or limited spaces.</li>
          <li>Use <strong>Teachers by Class</strong> to quickly identify class teacher assignments.</li>
        </ul>
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedReport.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedReport.desc}</p>
              </div>
              <button onClick={closeReport} className="text-gray-500 hover:text-red-500 text-2xl">×</button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-green-600 mx-auto mb-3"></div>
                    <p className="text-gray-500">Loading report...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 text-4xl mb-3">⚠️</div>
                  <p className="text-red-500">{error}</p>
                  <button
                    onClick={() => handleGenerate(selectedReport)}
                    className="mt-4 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  📄 No data available for this report.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-green-200">
                        {selectedReport.columns.map((column) => (
                          <th
                            key={column.key}
                            className="py-3 px-4 text-green-700 font-semibold whitespace-nowrap"
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-green-50">
                          {selectedReport.columns.map((column) => (
                            <td key={column.key} className="py-3 px-4">
                              {row[column.key] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={closeReport}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              {reportData.length > 0 && (
                <button
                  onClick={handlePrint}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  🖨️ Print Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorReports;