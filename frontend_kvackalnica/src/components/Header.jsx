import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import profileImage from "../assets/profile_image_default.png";

function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const { user, logout } = useAuth();

  // Check if we should show the home icon (not on Login, Registration, or Index pages)
  const shouldShowHomeIcon = !['/Login', '/Registration', '/'].includes(location.pathname);

  const handleLogout = () => {
    logout();
    alert("Odjavljen si!");
    navigate("/Login");
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setOpen(false);
        }
    };

    if (open) {
        document.addEventListener("mousedown", handleClickOutside);
    } else {
        document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
        {/* Home Icon - Left Side */}
        {shouldShowHomeIcon && (
            <header className="absolute top-8 left-8">
                <Link
                    to="/"
                    className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors shadow-lg cursor-pointer hover:scale-110 transition"
                    title="Nazaj na glavno stran"
                >
                    <svg 
                        className="w-6 h-6 text-white" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                </Link>
            </header>
        )}

        {/* Profile Menu - Right Side */}
        <header className="absolute top-8 right-8">
            <div className="relative" ref={menuRef}>
                <img 
                    src={profileImage}
                    alt="User"
                    className="w-10 cursor-pointer hover:scale-110 transition"
                    onClick={() => setOpen(!open)}
                />

                {open && (
                    <div className="absolute right-0 mt-3 bg-white border shadow-lg rounded-lg w-48 text-center">
                        {/* Username display */}
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <p className="text-sm font-semibold text-gray-800">{user?.username || "Uporabnik"}</p>
                        </div>
                        
                        {/* Menu items */}
                        <Link
                            to="/ChangePassword"
                            className="block py-3 px-4 text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            🔒 Spremeni geslo
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="block w-full py-3 px-4 text-red-500 hover:bg-gray-100 rounded-b-lg transition-colors"
                        >
                            Odjava
                        </button>
                    </div>
                )}
            </div>
        </header>
    </>
  );
}

export default Header;
