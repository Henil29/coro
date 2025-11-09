import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios.js';
import { UserContext } from '../context/user.context';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const { setUser } = useContext(UserContext);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await axios
            .post('/user/register', formData)
            .then((res) => {
                console.log('Registration successful:', res.data);
                localStorage.setItem('token', res.data.token);
                setUser(res.data.user);
                navigate('/');
            })
            .catch((error) => {
                console.error('Registration failed:', error.response?.data || error.message);
            });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-(--color-primary)">
            <div className="w-full max-w-md p-8 space-y-6 bg-(--color-secondary) border border-(--color-border) rounded-2xl shadow-lg shadow-(--color-accent)/10">
                <h2 className="text-2xl font-bold text-center mb-2">
                    Create Your Account
                </h2>
                <p className="text-sm text-center opacity-70 mb-6">
                    Join <span className="text-(--color-accent) font-medium">Coro</span> and start collaborating.
                </p>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium opacity-80 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            className="w-full px-4 py-2 bg-(--color-primary) border border-(--color-border) rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-accent) text-(--color-light) placeholder-(--color-muted)"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium opacity-80 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="w-full px-4 py-2 bg-(--color-primary) border border-(--color-border) rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-accent) text-(--color-light) placeholder-(--color-muted)"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium opacity-80 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className="w-full px-4 py-2 bg-(--color-primary) border border-(--color-border) rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-accent) text-(--color-light) placeholder-(--color-muted)"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-2 mt-2 bg-(--color-accent) text-(--color-primary) font-semibold rounded-md hover:bg-(--color-accent-hover) transition-all shadow-md"
                    >
                        Register
                    </button>
                </form>

                <p className="text-sm text-center opacity-70">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-(--color-accent) hover:underline hover:opacity-90"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
