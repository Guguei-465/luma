import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

const DashboardNavBar = ({ onMenuClick }) => {
    const { user, Logout } = useContext(AuthContext);

    // Safe fallback for user initial
    const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';

    return (
        <nav className='w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3'>
            <div className='flex items-center justify-between max-w-full'>
                {/* Left side: Menu + Brand */}
                <div className='flex items-center gap-3'>
                    <button 
                        onClick={onMenuClick}
                        className='md:hidden text-xl sm:text-2xl text-gray-700 active:scale-95 transition-transform'
                        aria-label='Toggle menu'
                    >
                        <i className='bi bi-list'></i>
                    </button>

                    <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-base'>
                            {userInitial}
                        </div>
                        <span className='text-base md:text-xl font-bold from text-yellow-600 to text-orange-600 tracking-tight'>
                            Luma 2000 Academy
                        </span>
                    </div>
                </div>

                {/* Right side: User + Logout */}
                <div className='flex items-center gap-2 sm:gap-3 md:gap-4'>
                    {/* User info – visible from small screens up */}
                    <div className='hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full'>
                        <div className='w-7 h-7 rounded-full bg-gray-500 text-white flex items-center justify-center text-sm font-bold'>
                            {userInitial}
                        </div>
                        <div className='flex flex-col leading-tight'>
                            <span className='text-sm font-semibold text-gray-800'>
                                {user?.username || 'User'}
                            </span>
                            <span className='text-xs text-green-600 font-medium capitalize'>
                                {(user?.role || '').toLowerCase().replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Logout button */}
                    <button 
                        onClick={Logout}
                        className='px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-red-500 text-red-900
                                   hover:bg-red-500 hover:text-white transition-all duration-200 active:scale-95'
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default DashboardNavBar;