import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from "../components/Header";
import YarnCorner from "../components/YarnCorner";
import HomeButton from "../components/HomeButton";
import ImageGallery from "../components/ImageGallery";

function FinishedProjects() {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { getAuthHeaders, isAuthenticated } = useAuth();

    useEffect(() => {
        fetchProjects();
    }, []);

    // Helper function to get correct Slovenian plural form
    const getProjectCountText = (count) => {
        if (count === 1) {
            return "1 projekt končan";
        } else if (count === 2) {
            return "2 projekta končana";
        } else if (count === 3 || count === 4) {
            return `${count} projekti končani`;
        } else {
            return `${count} projektov končanih`;
        }
    };

    // Helper function to check if project is finished
    const isFinished = (project) => {
        return project.status === 'finished' || project.status === 'true' || project.status === true || project.status === 1;
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

            const data = await response.json();
            console.log("All projects received:", data);
            
            if (response.ok) {
                // Filtriraj samo končane projekte in sortiraj po datumu končanja (najnovejši najprej)
                const finishedProjects = data.filter(isFinished)
                    .sort((a, b) => {
                        // Sort by finished_at date, newest first
                        if (!a.finished_at && !b.finished_at) return 0;
                        if (!a.finished_at) return 1; // Projects without finished_at go to end
                        if (!b.finished_at) return -1;
                        return new Date(b.finished_at) - new Date(a.finished_at);
                    });
                console.log("All projects:", data);
                console.log("Project statuses:", data.map(p => ({ id: p.id, name: p.name, status: p.status, statusType: typeof p.status, finished_at: p.finished_at })));
                console.log("Finished projects (sorted):", finishedProjects);
                console.log("Finished projects with dates:", finishedProjects.map(p => ({ name: p.name, finished_at: p.finished_at, created_at: p.created_at })));
                setProjects(finishedProjects);
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

    const deleteProject = async (projectId) => {
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
            
            <h1 className='page-title'>Končani projekti</h1>
            
            {projects.length > 0 && (
                <div className='mb-6'>
                    <span className='status-badge'>
                        {getProjectCountText(projects.length)}
                    </span>
                </div>
            )}
            
            {isLoading ? (
                <div className='text-center'>
                    <p className='text'>Nalagam projekte...</p>
                    <div className='loading-spinner'></div>
                </div>
            ) : projects.length === 0 ? (
                <div className='text-center'>
                    <p className='text text-gray-600 mb-4'>Nimate končanih projektov.</p>
                    <p className='text text-sm text-gray-500'>Označite projekte kot končane, da se prikažejo tukaj!</p>
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
                                    <p className='project-date-blue mb-2'>
                                        Ustvarjen: {new Date(project.created_at).toLocaleDateString('sl-SI')}
                                    </p>
                                    {console.log('Project finished_at:', project.finished_at, 'for project:', project.name)}
                                    {project.finished_at && (
                                        <p className='project-date-blue mb-4'>
                                            Končan: {new Date(project.finished_at).toLocaleDateString('sl-SI')}
                                        </p>
                                    )}
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

export default FinishedProjects;