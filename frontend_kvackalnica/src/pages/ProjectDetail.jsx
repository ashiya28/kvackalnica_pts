import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from "../components/Header";
import YarnCorner from "../components/YarnCorner";
import HomeButton from "../components/HomeButton";
import ImageUpload from "../components/ImageUpload";
import ImageGallery from "../components/ImageGallery";
import StarRating from '../components/StarRating';

function ProjectDetail() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { getAuthHeaders, isAuthenticated } = useAuth();
    
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/Login');
            return;
        }
        fetchProject();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const projectData = await response.json();
                setProject(projectData);
            } else {
                const errorData = await response.json().catch(() => ({}));
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

    const handleEdit = () => {
        navigate(`/project/${projectId}/edit`);
    };

    const handleDelete = async () => {
        if (!confirm("Ali ste prepričani, da želite izbrisati ta projekt?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            
            if (response.ok) {
                alert("Projekt uspešno izbrisan!");
                navigate('/');
            } else {
                alert(data.error || "Napaka pri brisanju projekta!");
            }
        } catch (err) {
            console.error("Napaka pri brisanju projekta:", err);
            alert("Napaka pri povezavi s strežnikom!");
        }
    };

    const handleMarkAsFinished = async () => {
        if (!confirm("Ali želite označiti ta projekt kot končan?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    status: 'finished'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert("Projekt označen kot končan!");
                navigate('/FinishedProjects');
            } else {
                alert(data.error || "Napaka pri označevanju projekta!");
            }
        } catch (err) {
            console.error("Napaka pri označevanju projekta:", err);
            alert("Napaka pri povezavi s strežnikom!");
        }
    };

    const handleImagesUploaded = () => {
        setImageRefreshTrigger(prev => prev + 1);
    };

    if (isLoading) {
        return (
            <div className="page-container">
                <Header />
                <YarnCorner />
                <HomeButton />
                <div className="flex justify-center items-center h-screen">
                    <div className="text-lg">Nalagam projekt...</div>
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
                <div className="flex justify-center items-center h-screen">
                    <div className="text-lg">Projekt ni najden!</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Header />
            <YarnCorner />
            <HomeButton />

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Project Header */}
                <div className="text-center mb-8">
                    <h1 className="page-title">
                        Projekt: {project.name}
                    </h1>
                </div>

                {/* Project Description */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-black mb-4 text-center">Opis projekta</h2>
                    <p className="text-black leading-relaxed whitespace-pre-wrap text-center">
                        {project.description}
                    </p>
                </div>

                {/* Image Gallery */}
                <ImageGallery projectId={projectId} refreshTrigger={imageRefreshTrigger} />

                {/* Image Upload */}
                <ImageUpload projectId={projectId} onImagesUploaded={handleImagesUploaded} />

                {/* Difficulty Rating (moved before Created Date) */}
                <div className="mt-6 mb-4 flex justify-center">
                    <div className="text-center">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ocena težavnosti</label>
                        <StarRating
                            projectId={project.id}
                            initial={project.difficulty_rating || 3}
                            getAuthHeaders={getAuthHeaders}
                            onSaved={(updatedProject) => {
                                if (updatedProject && updatedProject.id) {
                                    setProject(prev => ({ ...prev, ...updatedProject }));
                                } else if (updatedProject && updatedProject.difficulty_rating) {
                                    setProject(prev => ({ ...prev, difficulty_rating: updatedProject.difficulty_rating }));
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Created Date */}
                <div className="flex items-center justify-center mb-8">
                    <span className="text-black text-sm">
                        Ustvarjen: {new Date(project.created_at).toLocaleDateString('sl-SI')}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-3 mb-8">
                    <button
                        onClick={handleEdit}
                        className="btn-details-blue"
                    >
                        Uredi
                    </button>
                    {!project.status || project.status === 'in_progress' || project.status === false || project.status === 'false' ? (
                        <button
                            onClick={handleMarkAsFinished}
                            className="btn-finish-blue"
                        >
                            Označi kot končan
                        </button>
                    ) : null}
                    <button
                        onClick={handleDelete}
                        className="btn-delete-blue"
                    >
                        Izbriši
                    </button>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center mb-8">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        project.status === 'finished' || project.status === true || project.status === 'true' ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                        {project.status === 'finished' || project.status === true || project.status === 'true' ? '🔵 Končan' : '🔄 V teku'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ProjectDetail;
