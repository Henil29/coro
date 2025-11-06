import React, { useContext, useState } from 'react'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Home = () => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState(null)

    const createProject = (e) => {
        e.preventDefault();
        console.log({ projectName });
        axios.post('/project/create', {
            name: projectName,
        }).then((response) => {
            console.log(response.data);
        }).catch((error) => {
            console.error('There was an error creating the project!', error);
        });
        setIsModalOpen(false);
    }
    return (
        <main className='p-4'>
            <div className="projects">
                <button onClick={() => setIsModalOpen(true)} className="project p-4 border border-slate-300 rounded-md cursor-pointer">
                    New Project
                    <i className="ri-links-line ml-2"></i>
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Create Project</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                aria-label="Close"
                                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={createProject}>
                            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="projectName">
                                Project Name
                            </label>
                            <input
                                id="projectName"
                                name="projectName"
                                type="text"
                                placeholder="Enter project name"
                                className="w-full border border-slate-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Home;