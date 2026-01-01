import React from "react";
import { useNavigate } from "react-router-dom";

function Header() {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(-1)}
            className='absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-sky-400 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:bg-sky-500 hover:scale-105 transition-all duration-300'
        >
            Nazaj
        </button>
    );
}

export default Header;
