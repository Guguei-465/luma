import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./components/context/AuthContext";
import ProtectedRoutes from "./components/context/ProtectedRoutes";
import Login from "./components/Login";
import Home from "./components/Home";
import NotFound from "./components/NotFound";
import Unauthorized from "./components/Unauthorized";
import AccountantLayout from "./components/accountant/AccountantLayout";
import AccountantDashboard from "./components/accountant/AccountantDashboard";
import AccountantProfile from "./components/accountant/AccountantProfile";
import AccountantNotice from "./components/accountant/AccountantNotices";
import ParentDashboard from "./components/parents/ParentDashboard";
import MyChildren from "./components/parents/MyChildren";
import ParentAttendance from "./components/parents/ParentAttendance";
import ParentResults from "./components/parents/ParentsResults";
import ParentFees from "./components/parents/ParentFees";
import ParentNotifications from "./components/parents/ParentNotifications";
import ParentProfile from "./components/parents/ParentProfile";
import ParentLayout from "./components/parents/ParentLayout";
import ParentReportCard from "./components/parents/ParentReportCard";
import ParentPayment from "./components/parents/ParentPayment";
import ChildDetail from "./components/parents/ChildDetails";
import TeacherMarksEntry from "./components/teachers/TeacherMarksEntry";
import TeacherResults from "./components/teachers/TeacherResults";
import TeacherAttendance from "./components/teachers/TeacherAttendance";
import TeacherReports from "./components/teachers/TeacherReports";
import TeacherLayout from "./components/teachers/TeacherLayout";
import TeacherDashboard from "./components/teachers/TeacherDashboard";
import TeacherStudents from "./components/teachers/TeacherStudents";
import TeacherAssessments from "./components/teachers/TeacherAssessments";
import TeacherTimetable from "./components/teachers/TeacherTimetable";
import TeacherProfile from "./components/teachers/TeacherProfile";
import ResetPassword from "./components/ResetPassword";
import AcademicCoLayout from "./components/academiccoordinator/AcademicCoLayout";
import AcademicCoDashboard from "./components/academiccoordinator/AcademicCoDashboard";
import SubjectsAcademic from "./components/academiccoordinator/SubjectsAcademic";
import Assessments from "./components/academiccoordinator/Assessments";
import Timetable from "./components/academiccoordinator/Timetable";
import TimetableForm from "./components/academiccoordinator/TimetableForm";
import AcademicCoProfile from "./components/academiccoordinator/AademicCoProfile";
import LearningOutcomes from "./components/academiccoordinator/LearnigOutcomes";
import GradeScales from "./components/academiccoordinator/GradeScales";
import ResultSubmissions from "./components/academiccoordinator/ResultSubmissions";
import StudentResults from "./components/academiccoordinator/StudentResults";
import SentNotices from "./components/accountant/SentNotices";
import RecordPayment from "./components/accountant/RecordPayment";
import ReceiptGenerator from "./components/accountant/ReceiptGenerator";
import PendingFees from "./components/accountant/PendingFees";
import FinancialReports from "./components/accountant/FinancialReports";
import FeesDashboard from "./components/accountant/FeesDashboard";
import FeeRecords from "./components/accountant/FeeRecords";
// ================= ADMIN =================
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import ListStudents from "./components/admin/ListStudents";
import EditStudent from "./components/admin/EditStudent";
import ListTeachers from "./components/admin/ListTeachers";
import AddTeacher from "./components/admin/AddTeacher";
import EditTeacher from "./components/admin/EditTeacher";
import ListParents from "./components/admin/ListParents";
import AddParent from "./components/admin/AddParent";
import EditParent from "./components/admin/EditParent";
import FeeStructureList from "./components/admin/FeeStructureList";
import FeePaymentsList from "./components/admin/FeePaymentsList";
import DailyAttendance from "./components/admin/DailyAttendance";
import AttendanceReports from "./components/admin/AttendanceReports";
import ExamList from "./components/admin/ExamList";
import AdminUserList from "./components/admin/AdminUserList";
import AdminNotices from "./components/admin/AdminNotices";
import SendNotices from "./components/admin/SendNotices";
import AdminProfile from "./components/admin/AdminProfile";
import AddStudent from "./components/admin/AddStudent";
import AcademicCoClasses from "./components/academiccoordinator/AcademicCoClasses";
import CoordinatorTeachers from "./components/academiccoordinator/CoordinatorTeachers";
import CoordinatorClassDetails from "./components/academiccoordinator/CoordinatorClassDetails";
import CoordinatorStudentDetails from "./components/academiccoordinator/CoordinatorStudentDetails";
import CoordinatorStudents from "./components/academiccoordinator/CoordinatorStudents";
import CoordinatorExamDetails from "./components/academiccoordinator/CoordinatorExamDetails";
import CoordinatorExams from "./components/academiccoordinator/CoordinatorExams";
import CoordinatorReports from "./components/academiccoordinator/CoordinatorReports";
import ParentStudentReportCard from "./components/parents/ParentStudentReportCard";
import FeeStructures from "./components/accountant/FeeStructures";
import AcademicTeacherProfile from "./components/academiccoordinator/AcademicTeacherProfile";
import AcademicCoordinatorResults from "./components/academiccoordinator/AcademicCoordinatorResults";
import ParentChildren from "./components/admin/ParentChildren";

function App() {
  return (
<BrowserRouter>
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Global Protected Routes Wrapper */}
        <Route element={<ProtectedRoutes />}>

{/* admin routs */}
          {/* ================= ADMIN ================= */}
          <Route
            path="/admin-dashboard"
            element={
            <ProtectedRoutes allowedRoles={["super_admin"]}>
                <AdminLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<ListStudents />} />
            <Route path="students/add" element={<AddStudent />} />
            <Route path="students/edit/:id" element={<EditStudent />} />
            <Route path="teachers" element={<ListTeachers />} />
            <Route path="teachers/add" element={<AddTeacher />} />
            <Route path="teachers/edit/:id" element={<EditTeacher />} />
            <Route path="parents" element={<ListParents />} />
            <Route path="parents/add" element={<AddParent />} />
            <Route path="parents/:id/children" element={<ParentChildren />} />
            <Route path="parents/edit/:id" element={<EditParent />} />
            <Route path="fees-structures" element={<FeeStructureList />} />
            <Route path="fees-payments" element={<FeePaymentsList />} />
            <Route path="attendance" element={<DailyAttendance />} />
            <Route path="attendance/reports" element={<AttendanceReports />} />
            <Route path="exams" element={<ExamList />} />
            <Route path="users" element={<AdminUserList />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="notices/send" element={<SendNotices />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* ================= ACADEMIC COORDINATOR ================= */}
          <Route path="/academic-coordinator" element={
            <ProtectedRoutes allowedRoles={["academic-coordinator"]}>
              <AcademicCoLayout />
            </ProtectedRoutes>
          }>
            <Route index element={<AcademicCoDashboard />} />

            {/* Students */}
            <Route path="students" element={<CoordinatorStudents />} />
            <Route path="student-details/:id" element={<CoordinatorStudentDetails />} />
            <Route path="student-results/:id" element={<StudentResults />} />          

            {/* Reports */}
            <Route path="reports" element={<CoordinatorReports />} />
            <Route path="reports/student-progress/:id" element={<CoordinatorReports />} />
            <Route path="academic-results" element={<AcademicCoordinatorResults />} />


            {/* Teachers */}
            <Route path="teachers" element={<CoordinatorTeachers />} />
            <Route path="teachers/:teacherId" element={<AcademicTeacherProfile />} />

            {/* Subjects & Classes */}
            <Route path="subjects" element={<SubjectsAcademic />} />
            <Route path="classes" element={<AcademicCoClasses />} />
            <Route path="classes-details/:id" element={<CoordinatorClassDetails />} />
            <Route path="classes-exam/:id" element={<CoordinatorExamDetails />} />
           


            {/* Results & Assessments */}
            <Route path="result-submissions" element={<ResultSubmissions />} />
            <Route path="assessments" element={<Assessments />} />

            {/* Exams & Timetable */}
            <Route path="exams" element={<CoordinatorExams />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="timetable/create" element={<TimetableForm />} />

            {/* Settings & Profile */}
            <Route path="grade-scales" element={<GradeScales />} />
            <Route path="learning-outcomes" element={<LearningOutcomes />} />
            <Route path="profile" element={<AcademicCoProfile />} />
          </Route>

          {/* ================= ACCOUNTANT ================= */}
          <Route
            path="/accountant"
            element={
              <ProtectedRoutes allowedRoles={["accountant"]}>
                <AccountantLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<AccountantDashboard />} />
            <Route path="dashboard" element={<AccountantDashboard />} />
            <Route path="notices" element={<AccountantNotice />} />
            <Route path="profile" element={<AccountantProfile />} />
            <Route path="fee-records" element={<FeeRecords />} />
            <Route path="fee-structure" element={<FeeStructures />} />
            <Route path="fees-dashboard" element={<FeesDashboard />} />
            <Route path="financial-reports" element={<FinancialReports />} />
            <Route path="pending-fees" element={<PendingFees />} />
            <Route path="receipt-generator" element={<ReceiptGenerator />} />
            <Route path="record-payment" element={<RecordPayment />} />
            <Route path="sent-notices" element={<SentNotices />} />
          </Route>

{/* ================= PARENT (Fixed & Protected) ================= */}
          <Route
            path="/parent-dashboard"
            element={
              <ProtectedRoutes allowedRoles={["parent"]}>
                <ParentLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<ParentDashboard />} />
            <Route path="my-children" element={<MyChildren />} />
            <Route path="my-children/:studentId" element={<ChildDetail />} />
            <Route
              path="/parent-dashboard/report-card/:studentId/:academicYear/:term"
              element={<ParentStudentReportCard />}
            />
            <Route path="attendance/" element={<ParentAttendance />} />
            <Route path="results/" element={<ParentResults />} />
            <Route path="fees/" element={<ParentFees />} />
            <Route path="payments/:studentId" element={<ParentPayment/>} />
            <Route path="report-cards/" element={<ParentReportCard />} />
            <Route path="notifications" element={<ParentNotifications />} />
            <Route path="profile" element={<ParentProfile />} />
          </Route>

          <Route
            path="/teacher"
            element={
              <ProtectedRoutes allowedRoles={["teacher"]}>
                <TeacherLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="assessments" element={<TeacherAssessments />} />
            <Route path="assessments/:assessment_id/marks" element={<TeacherMarksEntry />} />
            <Route path="results" element={<TeacherResults />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="timetable" element={<TeacherTimetable />} />
            <Route path="reports" element={<TeacherReports />} />
            <Route path="profile" element={<TeacherProfile />} />
          </Route>

          

{/* Optional General Redirect */}
          <Route path="/dashboard" element={<Navigate to="/parent" replace />} />
        </Route>

        {/* Admin alias — backward compatible redirect */}
        <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />

        {/* ERROR PAGES */}
        <Route path="/not_authorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
  );
}

export default App;