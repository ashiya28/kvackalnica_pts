import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from "../components/Header";
import YarnCorner from "../components/YarnCorner";
import HomeButton from "../components/HomeButton";

function EditProject() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { getAuthHeaders, isAuthenticated } = useAuth();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (!isAuthenticated()) {
            alert('Morate biti prijavljeni!');
            navigate('/Login');
            return;
        }
        fetchProject();
    }, [projectId, navigate, isAuthenticated]);

    const fetchProject = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const projectData = await response.json();
                setProject(projectData);
                setFormData({
                    name: projectData.name,
                    description: projectData.description
                });
            } else {
                const errorData = await response.json();
                alert(`Projekt ni najden! ${errorData.error || ''}`);
                navigate('/');
            }
        } catch (err) {
            console.error('Network error:', err);
            alert('Napaka pri povezavi s strežnikom!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.description.trim()) {
            alert("Ime in opis projekta sta obvezna!");
            return;
        }

        setIsUpdating(true);

        try {
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description
                })
            });

            const data = await response.json();

            if (response.ok) {
                navigate(`/project/${projectId}`);
            } else {
                alert(data.error || "Napaka pri posodabljanju projekta!");
            }
        } catch (err) {
            console.error("Napaka pri posodabljanju projekta:", err);
            alert("Napaka pri povezavi s strežnikom!");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        navigate(`/project/${projectId}`);
    };

    if (isLoading) {
        return (
            <div className="page-container">
                <Header />
                <YarnCorner />
                <HomeButton />
                <div className='text-center'>
                    <p className='text'>Nalagam projekt...</p>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mt-4'></div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="page-container">
                <Header />
                <YarnCorner />
                <HomeButton />
                <p className="text-center text-red-600">Projekt ni najden.</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Header />
            <YarnCorner />
            <HomeButton />

            <h1 className="page-title">Uredi projekt</h1>

            <form onSubmit={handleSubmit} className="form-container">
                <label className='form-label'>Ime projekta: </label>
                <input 
                    type="text" 
                    placeholder="Ime projekta" 
                    className="form-input"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                />

                <label className='form-label'>Opis projekta: </label>
                <textarea 
                    placeholder="Opis projekta" 
                    className="form-input h-32 resize-none"
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    required 
                />

                <div className="flex justify-center space-x-4 mt-6">
                    <button 
                        type="submit" 
                        className="special-button"
                        disabled={isUpdating}
                    >
                        {isUpdating ? "Shranjujem..." : "Shrani spremembe"}
                    </button>
                    <button 
                        type="button" 
                        onClick={handleCancel}
                        className="special-button bg-gray-500 hover:bg-gray-600"
                    >
                        Prekliči
                    </button>
                </div>
            </form>

            <div className='mb-20'></div>
        </div>
    );
}

export default EditProject;
