import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center max-w-md w-full">
        <FaExclamationTriangle className="text-amber-500 mb-4 mx-auto" size={70} />
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-2">404</h1>
        <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h3>
        <p className="text-gray-600 mb-8">
          Sorry, the page you are looking for does not exist or may have been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 active:scale-95"
        >
          Back Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;