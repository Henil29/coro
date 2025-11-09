import { Route, BrowserRouter, Routes, useLocation } from 'react-router-dom';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Home from '../screens/Home';
import Project from '../screens/Project';
import UserAuth from '../auth/UserAuth';
import Navbar from '../components/Navbar';

const AppContent = () => {
    const location = useLocation();
    const isProjectPage = /^\/project\/[^/]+$/.test(location.pathname);

    return (
        <>
            {!isProjectPage && <Navbar />}

            <Routes>
                <Route path="/" element={<UserAuth><Home /></UserAuth>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/project/:name" element={<UserAuth><Project /></UserAuth>} />
            </Routes>
        </>
    );
};

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
};

export default AppRoutes;
