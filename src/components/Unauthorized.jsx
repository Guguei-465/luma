import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center max-w-md w-full">
        <FaLock className="text-red-500 mb-4 mx-auto" size={70} />
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-2">401</h1>
        <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">Unauthorized</h3>
        <p className="text-gray-600 mb-8">
          Your session has expired or you do not have permission to view this page.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 active:scale-95"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;