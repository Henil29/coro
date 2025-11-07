import React, { useEffect, useState, useRef } from "react";
import axios from "../config/axios";

const Navbar = ({ username = "Unknown", onProjectCreated }) => {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "default");
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef();

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const themes = [
        { id: "default", label: "Dark+ (VS Code)" },
        { id: "monokai", label: "Monokai" },
        { id: "light", label: "Light+" },
    ];

    const createProject = (e) => {
        e.preventDefault();
        axios
            .post("/project/create", { name: e.target.projectName.value })
            .then((response) => {
                console.log("Project created:", response.data);
                if (onProjectCreated) onProjectCreated();
            })
            .catch((error) =>
                console.error("Error creating project:", error.response?.data || error.message)
            );
        setIsModalOpen(false);
    };

    return (
        <nav className="bg-(--color-secondary) text-(--color-light) border-b border-(--color-border) p-4 md:px-6 shadow-md">
            {/* Top bar */}
            <div className="flex justify-between items-center">
                {/* Brand */}
                <h1 className="text-xl font-bold tracking-tight">
                    Coro<span className="text-(--color-accent)">.</span>
                </h1>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Theme Switcher */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center gap-2 bg-(--color-tertiary) hover:bg-(--color-border) px-4 py-2 rounded-lg transition-all"
                        >
                            <i className="ri-palette-line text-(--color-accent)"></i>
                            <span className="text-sm font-medium truncate">
                                {themes.find((t) => t.id === theme)?.label}
                            </span>
                            <i
                                className={`ri-arrow-down-s-line transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                    }`}
                            ></i>
                        </button>

                        {isOpen && (
                            <div className="absolute right-0 mt-2 w-44 bg-(--color-tertiary) border border-(--color-border) rounded-lg shadow-xl overflow-hidden animate-fadeIn z-50">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setTheme(t.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-(--color-border) transition-all ${theme === t.id
                                                ? "text-(--color-accent) font-medium"
                                                : ""
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* New Project Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2 bg-(--color-accent) text-(--color-primary) hover:opacity-90 transition-all rounded-xl text-sm font-semibold shadow-lg"
                    >
                        <i className="ri-add-line text-lg"></i> New Project
                    </button>

                    {/* User */}
                    <div className="flex items-center gap-2 bg-(--color-tertiary) px-3 py-2 rounded-lg border border-(--color-border)">
                        <i className="ri-user-line text-(--color-accent)"></i>
                        <span className="text-sm font-medium">{username}</span>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-2xl text-(--color-accent)"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <i className={isMenuOpen ? "ri-close-line" : "ri-menu-line"}></i>
                </button>
            </div>

            {/* Mobile Slide Menu */}
            {isMenuOpen && (
                <div className="mt-4 flex flex-col gap-3 bg-(--color-secondary) border-t border-(--color-border) p-4 rounded-lg animate-fadeIn md:hidden">
                    {/* Theme Switcher */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center justify-between w-full gap-2 bg-(--color-tertiary) hover:bg-(--color-border) px-4 py-2 rounded-lg transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <i className="ri-palette-line text-(--color-accent)"></i>
                                <span className="text-sm font-medium">
                                    {themes.find((t) => t.id === theme)?.label}
                                </span>
                            </div>
                            <i
                                className={`ri-arrow-down-s-line transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                    }`}
                            ></i>
                        </button>

                        {isOpen && (
                            <div className="absolute left-0 right-0 mt-2 bg-(--color-tertiary) border border-(--color-border) rounded-lg shadow-lg overflow-hidden z-50">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setTheme(t.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-(--color-border) transition-all ${theme === t.id
                                                ? "text-(--color-accent) font-medium"
                                                : ""
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* New Project Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 w-full px-5 py-2 bg-(--color-accent) text-(--color-primary) hover:opacity-90 transition-all rounded-xl text-sm font-semibold shadow-lg"
                    >
                        <i className="ri-add-line text-lg"></i> New Project
                    </button>

                    {/* User Info */}
                    <div className="flex items-center justify-center gap-2 bg-(--color-tertiary) px-3 py-2 rounded-lg border border-(--color-border)">
                        <i className="ri-user-line text-(--color-accent)"></i>
                        <span className="text-sm font-medium">{username}</span>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-(--color-secondary) border border-(--color-accent) rounded-2xl shadow-2xl w-full max-w-md p-6 text-(--color-light)">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Create New Project</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-2xl leading-none opacity-70 hover:opacity-100"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={createProject}>
                            <label htmlFor="projectName" className="block text-sm font-medium mb-2 opacity-80">
                                Project Name
                            </label>
                            <input
                                id="projectName"
                                type="text"
                                placeholder="Enter project name..."
                                className="w-full bg-(--color-primary) border border-(--color-accent) rounded-md p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-(--color-accent) text-(--color-light)"
                                required
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-md border border-(--color-accent) text-(--color-light) hover:bg-(--color-primary) transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-md bg-(--color-accent) text-(--color-primary) hover:opacity-90 transition-all font-medium"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
