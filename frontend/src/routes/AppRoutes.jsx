import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import { UserContext } from '../context/user.context'
import { useContext } from 'react'

const AppRoutes = () => {
    const { user } = useContext(UserContext);

    return (
        <BrowserRouter>
            <Routes>
                {user !== null ? (
                    <Route path="/" element={<Home />} />
                ) : (
                    <>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </>
                )}

            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes