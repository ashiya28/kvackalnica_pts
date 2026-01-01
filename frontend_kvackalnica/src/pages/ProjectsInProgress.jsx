import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from "../components/Header";
import YarnCorner from "../components/YarnCorner";
import HomeButton from "../components/HomeButton";
import ImageGallery from "../components/ImageGallery";

function ProjectsInProgress() {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { getAuthHeaders, isAuthenticated, checkAuthResponse } = useAuth();

    useEffect(() => {
        fetchProjects();
    }, []);

    // Helper function to get correct Slovenian plural form
    const getProjectCountText = (count) => {
        if (count === 1) {
            return "1 projekt v teku";
        } else if (count === 2) {
            return "2 projekta v teku";
        } else if (count === 3 || count === 4) {
            return `${count} projekti v teku`;
        } else {
            return `${count} projektov v teku`;
        }
    };

    // Helper function to check if project is in progress
    const isInProgress = (project) => {
        return project.status === 'in_progress' || project.status === 'false' || project.status === false || project.status === 0;
    };

    const fetchProjects = async () => {
        if (!isAuthenticated()) {
            alert('Morate biti prijavljeni!');
            navigate('/Login');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/projects/myprojects', {
                method: 'GET',
                headers: getAuthHeaders()
            });

            // Check if token expired and redirect to login
            if (checkAuthResponse(response, navigate)) {
                return;
            }

            const data = await response.json();
            console.log("All projects received:", data);
            
            if (response.ok) {
                // Filtriraj samo projekte, ki niso končani
                const inProgressProjects = data.filter(isInProgress);
                console.log("All projects:", data);
                console.log("Project statuses:", data.map(p => ({ id: p.id, name: p.name, status: p.status, statusType: typeof p.status })));
                console.log("In progress projects:", inProgressProjects);
                setProjects(inProgressProjects);
            } else {
                alert(data.error || "Napaka pri pridobivanju projektov!");
            }
        } catch (err) {
            console.error("Napaka pri pridobivanju projektov:", err);
            alert("Napaka pri povezavi s strežnikom!");
        } finally {
            setIsLoading(false);
        }
    };

    const markAsFinished = async (projectId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    status: true
                })
            });

            // Check if token expired and redirect to login
            if (checkAuthResponse(response, navigate)) {
                return;
            }

            const data = await response.json();
            
            if (response.ok) {
                alert("Projekt označen kot končan!");
                fetchProjects(); // Osveži seznam
            } else {
                alert(data.error || "Napaka pri posodabljanju projekta!");
            }
        } catch (err) {
            console.error("Napaka pri posodabljanju projekta:", err);
            alert("Napaka pri povezavi s strežnikom!");
        }
    };

    const deleteProject = async (projectId) => {
        if (!confirm("Ali ste prepričani, da želite izbrisati ta projekt?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            // Check if token expired and redirect to login
            if (checkAuthResponse(response, navigate)) {
                return;
            }

            const data = await response.json();
            
            if (response.ok) {
                alert("Projekt uspešno izbrisan!");
                fetchProjects(); // Osveži seznam
            } else {
                alert(data.error || "Napaka pri brisanju projekta!");
            }
        } catch (err) {
            console.error("Napaka pri brisanju projekta:", err);
            alert("Napaka pri povezavi s strežnikom!");
        }
    };


    return (
        <div className='page-container'>
            <Header />
            <YarnCorner />
            <HomeButton />

            <h1 className='page-title'>Projekti v teku</h1>
            
            {projects.length > 0 && (
                <div className='mb-6'>
                    <span className='bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold'>
                        {getProjectCountText(projects.length)}
                    </span>
                </div>
            )}
            
            {isLoading ? (
                <div className='text-center'>
                    <p className='text'>Nalagam projekte...</p>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mt-4'></div>
                </div>
            ) : projects.length === 0 ? (
                <div className='text-center'>
                    <p className='text text-gray-600 mb-4'>Nimate projektov v teku.</p>
                    <p className='text text-sm text-gray-500'>Dodajte nov projekt, da začnete!</p>
                </div>
            ) : (
                <div className='projects-list'>
                    {projects.map((project) => (
                        <div key={project.id} className='project-card-blue group'>
                            <div className="grid grid-cols-2 gap-6">
                                {/* Left side - Project details */}
                                <div className="space-y-3">
                                    <div className='mb-3'>
                                        <Link 
                                            to={`/project/${project.id}`}
                                            className='project-title-blue hover:text-gray-700 transition-colors cursor-pointer'
                                        >
                                            {project.name}
                                        </Link>
                                    </div>
                                    <p className='project-description-blue mb-3'>{project.description}</p>
                                    <p className='project-date-blue mb-4'>
                                        Ustvarjen: {new Date(project.created_at).toLocaleDateString('sl-SI')}
                                    </p>
                                </div>
                                
                                {/* Right side - Images */}
                                <div className="flex items-center justify-center">
                                    <ImageGallery projectId={project.id} refreshTrigger={0} compact={true} />
                                </div>
                            </div>
                            
                            {/* Action buttons - centered and only visible on hover */}
                            <div className='project-actions-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center space-x-3 mt-4'>
                                <Link 
                                    to={`/project/${project.id}`}
                                    className='btn-details-blue'
                                >
                                    Ogled podrobnosti
                                </Link>
                                <button 
                                    onClick={() => markAsFinished(project.id)}
                                    className='btn-finish-blue'
                                >
                                    Označi kot končan
                                </button>
                                <button 
                                    onClick={() => deleteProject(project.id)}
                                    className='btn-delete-blue'
                                >
                                    Izbriši
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className='mb-20'></div>
        </div>
    );
}

export default ProjectsInProgress;