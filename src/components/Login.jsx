// src/Login.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
const Login = (props) => {
    const {setLoginPopup} = props;
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const navigate = useNavigate();
    const { login,loginStatus,setLoginStatus,handleResetPopup } = useContext(AuthContext);
    const [loginInfo, setLoginInfo] = useState(null)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        try{
        setLoginInfo(null)
        e.preventDefault();
        const isLoggedIn = await login(formData.username, formData.password);
        console.log('$$$',isLoggedIn)
        setLoginStatus(isLoggedIn)
        loginStatus ? null : setLoginInfo(`Login failed, please try again!`) 
        }
        catch(error){
            setLoginStatus(false)
            setLoginInfo(`Login failed (${error.message}), please try again!`) 
        }
        
    };

    const handleResetPassword = () => {
        setLoginPopup(false);
        handleResetPopup();
        // navigate('/reset-request'); // 跳转到 /reset-request 路径
    };

   
    console.log("loginstatus",loginStatus)
    console.log("loginInfo",loginInfo)
    return (
        <div className='flex-1 p-4 flex-col justify-center item-center gap-3 sm:gap-4'>
        <form className="max-w-prose w-full mx-auto p-4 flex flex-col justify-center item-center gap-3 sm:gap-4" onSubmit={handleSubmit}>
            <input className="px-3 py-1 border border-slate-400 rounded-lg hover:border-blue-400" type="text" name="username" placeholder="Username" onChange={handleChange} />
            <input className="px-3 py-1 border border-slate-400 rounded-lg hover:border-blue-400" type="password" name="password" placeholder="Password" onChange={handleChange} />
            <button className="px-3 py-1 border items-center bg-white shadow rounded-lg tracking-wide text-lg text-slate-400 hover:text-blue-500 duration-200" type="submit">Login</button>
        </form>
        <h3 className="text-sm text-center text-slate-300">{loginInfo}</h3>
        <button className='text-sm text-red-300 hover:text-blue-400 mt-3' onClick={handleResetPassword}>Reset Password</button>
        </div>
    );
};

export default Login;