import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
        position: 'relative'
      }}
    >
      {/* Dark green overlay — keeps text readable */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 50, 20, 0.75), rgba(0, 80, 30, 0.65))'
        }}
      ></div>

      {/* Content — Above the overlay */}
      <div className="text-center max-w-lg w-full relative z-10">
        {/* Logo / Brand Circle with Icon */}
        <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center text-green-700 mb-6 shadow-lg">
          <i className="bi bi-book-half text-4xl"></i>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-md">
          LUMA 200 ACADEMY
        </h1>

        <p className="text-green-200 font-medium mb-4 text-lg">
          <i className="bi bi-stars me-2"></i>
          Excellence in CBC Education
        </p>

        <p className="text-green-50 text-base md:text-lg mb-8 leading-relaxed">
          Welcome to the official school management portal.
          Access student results, fee payments, reports, and announcements — all in one place.
        </p>

        {/* Feature Icons Row */}
        <div className="flex justify-center gap-8 mb-10 text-white">
          <div className="text-center">
            <i className="bi bi-mortarboard-fill text-3xl"></i>
            <p className="text-sm mt-2">Results</p>
          </div>
          <div className="text-center">
            <i className="bi bi-cash-coin text-3xl"></i>
            <p className="text-sm mt-2">Fees</p>
          </div>
          <div className="text-center">
            <i className="bi bi-bar-chart-fill text-3xl"></i>
            <p className="text-sm mt-2">Reports</p>
          </div>
          <div className="text-center">
            <i className="bi bi-bell-fill text-3xl"></i>
            <p className="text-sm mt-2">Updates</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full sm:w-auto px-10 py-3.5 bg-white text-green-700 hover:bg-green-50 font-bold rounded-lg shadow-lg transition-all duration-200 active:scale-95 text-lg"
        >
          <i className="bi bi-box-arrow-in-right me-2"></i>
          Login to Portal
        </button>

        <p className="mt-8 text-sm text-green-200">
          <i className="bi bi-people-fill me-1"></i>
          Teachers • Parents • Coordinators • Administration
        </p>
      </div>
    </div>
  );
};

export default Home;