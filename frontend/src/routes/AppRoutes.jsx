import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Home from '../screens/Home';
import { UserContext } from '../context/user.context';
import { useContext } from 'react';
import Project from '../screens/Project';

const AppRoutes = () => {
    const { user } = useContext(UserContext);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={user !== null ? <Home /> : <Navigate to="/login" replace />} />
                <Route path="/login" element={user === null ? <Login /> : <Navigate to="/" replace />} />
                <Route path="/register" element={user === null ? <Register /> : <Navigate to="/" replace />} />
                <Route path="/project/:name" element={user !== null ? <Project /> : <Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;