// src/Register.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState(null); // 用于存储错误信息
    const [success, setSuccess] = useState(null);

    const { register } = useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // 清空之前的错误信息
        try {
            await register(formData.username, formData.email, formData.password);
        } catch (error) {
            // 捕获异常并设置错误信息
            console.log("registration error",error)
            setError(error?.response?.data?.detail || "Registration failed. Please try again.");
        }
        setSuccess('Register Successfully!')
    };

    return (
        <div className='flex-1 p-4 flex-col justify-center item-center gap-3 sm:gap-4'>
        {error ? <h3 className=" text-sm text-center text-slate-400">{error}</h3> : <div>
        <form className="max-w-prose w-full mx-auto p-4 flex flex-col justify-center item-center gap-3 sm:gap-4" onSubmit={handleSubmit}>
            <input className="px-3 py-1 border border-slate-400 rounded-lg hover:border-blue-400" type="text" name="username" placeholder="Username" onChange={handleChange} />
            <input className="px-3 py-1 border border-slate-400 rounded-lg hover:border-blue-400" type="email" name="email" placeholder="Email" onChange={handleChange} />
            <input className="px-3 py-1 border border-slate-400 rounded-lg hover:border-blue-400" type="password" name="password" placeholder="Password" onChange={handleChange} />
            <button className="px-3 py-1 border items-center bg-white shadow rounded-lg tracking-wide text-lg text-slate-400 hover:text-blue-500 duration-200" type="submit">Register</button>
        </form>
        <h3 className=" text-sm text-center text-slate-400">{success}</h3>
        </div>
        }
        </div>
    );
};

export default Register;