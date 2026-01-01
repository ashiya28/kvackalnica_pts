import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from "../components/Header";
import YarnCorner from "../components/YarnCorner";
import HomeButton from "../components/HomeButton";

function AddNewProject() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { getAuthHeaders, isAuthenticated } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated()) {
            alert('Morate biti prijavljeni, da dodate projekt!');
            navigate('/Login');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/projects/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    name: title,
                    description: description
                })
            });

            const data = await response.json();

            if (response.ok) {
                setTitle('');
                setDescription('');
                navigate('/');
            } else {
                alert(data.error || "Napaka pri dodajanju projekta!");
            }
        } catch (err) {
            console.error("Napaka pri dodajanju projekta:", err);
            alert("Napaka pri povezavi s strežnikom!");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className='page-container'>
            <Header />
            <YarnCorner />
            <HomeButton />
            <h1 className='page-title'>Add new project</h1>
            
            <form
                onSubmit={handleSubmit}
                className='form-container'
            >
                <div className='w-full'>
                    <label className='form-label'>
                        Ime projekta:
                    </label>
                    <input
                        type='text'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder='Vnesite ime projekta'
                        className='form-input'
                        required
                    >
                    </input>
                </div>
                <div className='w-full'>
                    <label className='form-label'>
                        Opis projekta:
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder='Vnesite podrobnosti projekta, dodajte uporabljene volne, pripomočke, povezave do tutorialov, ...'
                        className='form-textarea'
                        required
                    >
                    </textarea>
                </div>

                <button
                    type='submit'
                    className='special-button'
                    disabled={isLoading}
                >
                    {isLoading ? 'Shranjujem...' : 'Shrani projekt'}
                </button>

            </form>

            <div className='mb-20'></div>
        </div>
    );
}

export default AddNewProject;