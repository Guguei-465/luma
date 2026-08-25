import React, { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

const DashboardNavBar = ({ onMenuClick }) => {
    const { user, Logout } = useContext(AuthContext);

    // Safe fallback for user initial
    const userInitial =
        user?.username?.charAt(0).toUpperCase() || "U";

    return (
        <nav className="w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="flex items-center justify-between max-w-full">

                {/* =====================================================
                    LEFT SIDE
                    MENU + BRAND
                    ===================================================== */}
                <div className="flex items-center gap-3">

                    {/* =================================================
                        MOBILE MENU BUTTON
                        ================================================= */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onMenuClick) {
                                onMenuClick();
                            }
                        }}
                        className="
                            md:hidden
                            flex
                            items-center
                            justify-center
                            w-10
                            h-10
                            rounded-lg
                            text-gray-700
                            hover:bg-gray-100
                            active:scale-95
                            transition-all
                            duration-200
                            cursor-pointer
                        "
                        aria-label="Open menu"
                    >
                        <i className="bi bi-list text-2xl sm:text-3xl" />
                    </button>

                    {/* =================================================
                        BRAND
                        ================================================= */}
                    <div className="flex items-center gap-2">

                        {/* User initial */}
                        <div
                            className="
                                w-8
                                h-8
                                rounded-full
                                bg-gray-600
                                flex
                                items-center
                                justify-center
                                text-white
                                font-bold
                                text-base
                                flex-shrink-0
                            "
                        >
                            {userInitial}
                        </div>

                        {/* Academy name */}
                        <span
                            className="
                                text-base
                                md:text-xl
                                font-bold
                                text-yellow-600
                                tracking-tight
                                whitespace-nowrap
                            "
                        >
                            Luma 2000 Academy
                        </span>
                    </div>
                </div>

                {/* =====================================================
                    RIGHT SIDE
                    USER + LOGOUT
                    ===================================================== */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">

                    {/* =================================================
                        USER INFO
                        Visible from small screens
                        ================================================= */}
                    <div
                        className="
                            hidden
                            sm:flex
                            items-center
                            gap-2
                            bg-gray-100
                            px-3
                            py-1.5
                            rounded-full
                        "
                    >
                        {/* User avatar */}
                        <div
                            className="
                                w-7
                                h-7
                                rounded-full
                                bg-gray-500
                                text-white
                                flex
                                items-center
                                justify-center
                                text-sm
                                font-bold
                                flex-shrink-0
                            "
                        >
                            {userInitial}
                        </div>

                        {/* User details */}
                        <div className="flex flex-col leading-tight">

                            <span className="text-sm font-semibold text-gray-800">
                                {user?.username || "User"}
                            </span>

                            <span className="text-xs text-green-600 font-medium capitalize">
                                {(user?.role || "")
                                    .toLowerCase()
                                    .replace("_", " ")}
                            </span>

                        </div>
                    </div>

                    {/* =================================================
                        LOGOUT
                        ================================================= */}
                    <button
                        type="button"
                        onClick={Logout}
                        className="
                            px-2.5
                            sm:px-3
                            py-1.5
                            text-xs
                            sm:text-sm
                            rounded-lg
                            border
                            border-red-500
                            text-red-900
                            hover:bg-red-500
                            hover:text-white
                            transition-all
                            duration-200
                            active:scale-95
                            cursor-pointer
                        "
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default DashboardNavBar;