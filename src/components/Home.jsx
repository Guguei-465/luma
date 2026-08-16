import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-green-800 mb-3">
          Luma 2000 Academy
        </h1>
        <p className="text-gray-600 text-base md:text-lg mb-8">
          Welcome to Luma 2000 Academy — your trusted school management portal
        </p>
        <button
          onClick={() => navigate("/login")}
          className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 active:scale-95"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Home;