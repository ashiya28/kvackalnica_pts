import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from "../components/Header";
import YarnCorner from "../components/YarnCorner";
import HomeButton from "../components/HomeButton";

function ChangePassword() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { getAuthHeaders, isAuthenticated } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            alert('Vsa polja so obvezna!');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Novo geslo in potrditev gesla se ne ujemata!');
            return;
        }


        if (oldPassword === newPassword) {
            alert('Novo geslo mora biti drugačno od starega gesla!');
            return;
        }

        // Check if user is logged in
        if (!isAuthenticated()) {
            alert('Morate biti prijavljeni!');
            navigate('/Login');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            });

            const data = await response.json();
            console.log("Odgovor strežnika:", data);

            if (response.ok) {
                alert(data.message || "Geslo uspešno spremenjeno!");
                // Clear form
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // Navigate back to home or profile
                navigate('/');
            } else {
                alert(data.error || "Napaka pri spreminjanju gesla!");
            }
        } catch (err) {
            console.error("Napaka pri spreminjanju gesla:", err);
            alert("Napaka pri povezavi s strežnikom!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='page-container'>
            <Header />
            <YarnCorner />
            <HomeButton />
            
            <h1 className='page-title'>Spremeni geslo</h1>
            
            <form onSubmit={handleSubmit} className='form-container'>
                <div className='w-full'>
                    <label className='form-label'>
                        Staro geslo:
                    </label>
                    <input
                        type='password'
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder='Vnesite trenutno geslo'
                        className='form-input'
                        required
                    />
                </div>
                
                <div className='w-full'>
                    <label className='form-label'>
                        Novo geslo:
                    </label>
                    <input
                        type='password'
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder='Vnesite novo geslo'
                        className='form-input'
                        required
                    />
                </div>
                
                <div className='w-full'>
                    <label className='form-label'>
                        Potrdi novo geslo:
                    </label>
                    <input
                        type='password'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder='Ponovno vnesite novo geslo'
                        className='form-input'
                        required
                    />
                </div>

                <button
                    type='submit'
                    className='special-button'
                    disabled={isLoading}
                >
                    {isLoading ? 'Spreminjam...' : 'Spremeni geslo'}
                </button>
            </form>

            <div className='mb-20'></div>
        </div>
    );
}

export default ChangePassword;
