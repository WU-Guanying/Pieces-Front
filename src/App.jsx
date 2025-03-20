import React from 'react';
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext.jsx';
import Register from './components/Register.jsx';
import Login from './components/Login.jsx';
import UserProfile from './components/UserProfile.jsx';
import Home from './components/Home.jsx'
import Reset from './components/Reset.jsx'
import ResetDetail from './components/ResetDetail.jsx';
import Header from './components/Header.jsx';

const App = () => {

    
    return (
        
        <Router>
           
            <AuthProvider>
                    {/* <Home/> */}
                    {/* <Header></Header> */}
                    <Routes>
                        <Route path="/" element={<Home/>}/>
                        <Route path="/profile" element={<UserProfile/>}/>
                        <Route path="/reset-confirm" element={<ResetDetail/>}></Route>
                    </Routes>
                
            </AuthProvider>
        </Router>

    );
};

export default App;