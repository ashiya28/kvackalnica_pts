import React from 'react';
import YarnCorner from "../components/YarnCorner";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate("/");
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Napaka pri prijavi:", err);
      alert("Napaka pri povezavi s strežnikom!");
    } finally {
      setIsLoading(false);
    }
  };

    return (
    <div className="page-container">
      <YarnCorner />

      <h1 className="page-title">Prijava</h1>
      <form onSubmit={handleSubmit} className="form-container">
        <label className='form-label'>Email: </label>
        <input type="email" placeholder="Email" className="form-input"
          value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className='form-label'>Geslo: </label>
        <input type="password" placeholder="Geslo" className="form-input"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
          
        <button type="submit"
          className="special-button"
          disabled={isLoading}>
          {isLoading ? "Prijavljam..." : "Prijavi se"}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-600 mb-2">Nimate še računa?</p>
        <Link 
          to="/Registration" 
          className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
        >
          Registrirajte se tukaj
        </Link>
      </div>

      <div className='mb-20'></div>
    </div>
  );
}

export default Login;
