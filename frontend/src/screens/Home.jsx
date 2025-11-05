import React, { useContext } from 'react'
import { UserContext } from '../context/user.context'

const Home = () => {
    const { user } = useContext(UserContext);
    return (
        <div>
            {/* //print user data */}
            {JSON.stringify(user)}
        </div>
    )
}

export default Home;