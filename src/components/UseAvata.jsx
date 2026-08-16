import React from "react";

const UserAvatar = ({ user, size = 40 }) => {
    const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";
    const photo = user?.profile_picture;

    if (photo) {
        return (
            <img
                src={photo}
                alt={user?.username || "User"}
                width={size}
                height={size}
                className="rounded-full border border-gray-200 object-cover bg-white"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div
            className="rounded-full bg-green-600 text-white flex items-center justify-center font-bold border border-green-700"
            style={{
                width: size,
                height: size,
                fontSize: Math.max(12, size / 2.2),
                userSelect: "none",
            }}
        >
            {firstLetter}
        </div>
    );
};

export default UserAvatar;