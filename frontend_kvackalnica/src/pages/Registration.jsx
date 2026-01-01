import React from 'react';
import YarnCorner from "../components/YarnCorner";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Registration() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:5000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();
    
    if (!response.ok){
      alert(data.error || "Napaka pri registraciji");
      return;
    }

    navigate("/Login");
  };

  return (
    <div className="page-container">
      <YarnCorner />
      <h1 className="page-title">Registracija</h1>
      
      <form onSubmit={handleSubmit} className="form-container">
        <label className='form-label'>Uporabniško ime: </label>
        <input type="text" placeholder="Uporabniško ime"
          className="form-input"
          value={username} onChange={(e) => setUsername(e.target.value)} required />

        <label className='form-label'>Email: </label>
        <input type="email" placeholder="Email"
          className="form-input"
          value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className='form-label'>Geslo: </label>
        <input type="password" placeholder="Geslo"
          className="form-input"
          value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit"
          className="special-button">
          Registriraj se
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-600 mb-2">Že imate račun?</p>
        <Link 
          to="/Login" 
          className="auth-link"
        >
          Prijavite se tukaj
        </Link>
      </div>

      <div className='mb-20'></div>
    </div>
  );
}

export default Registration;
