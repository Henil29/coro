import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const fetchProjects = async () => {
        await axios.get('/project/all')
            .then((response) => {
                setProjects(response.data.projects)
            })
            .catch((error) => console.error('Error fetching projects!', error));
    };
    const fetchUserName = async () => {
        axios.get('/user/')
            .then((response) => {
                setUser(response.data.user.name);
            })
            .catch((error) => console.error('Error fetching user data!', error));
    }

    const fetchData = async () => {
        await fetchProjects();
        await fetchUserName();
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            <Navbar onProjectCreated={fetchProjects} username={user} />
            <main className="min-h-screen bg-(--color-primary) text-(--color-light) p-8 transition-all duration-300">
                {/* HEADER */}
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
                </header>

                {/* PROJECT GRID */}
                <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {projects.map((project) => (
                        <div
                            onClick={() => navigate(`/project/${project.name}`, {
                                state: { project }
                            })}
                            key={project._id}
                            className="bg-(--color-secondary) border border-(--color-accent) p-5 rounded-xl shadow-md hover:shadow-[0_0_3px_var(--color-accent)] cursor-pointer transition-all group"
                        >
                            <h3 className="text-lg flex items-center justify-between w-full font-semibold mb-2">
                                {project.name}
                                <p className="text-sm mt-2 opacity-70"><i className="ri-user-line text-(--color-light)"></i> {project.users.length}</p>
                            </h3>
                            <p className="text-sm opacity-80">Collaborate with your team in real time.</p>
                        </div>
                    ))}

                    {projects.length === 0 && (
                        <p className="italic col-span-full text-center mt-10 opacity-70">
                            You don’t have any projects yet. Create one to get started!
                        </p>
                    )}
                </section>
            </main>
        </>
    );
};

export default Home;
