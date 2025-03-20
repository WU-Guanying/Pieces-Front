import React from 'react'
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useContext,useState } from 'react';
import { useNavigate } from 'react-router-dom';
const Reset = () => {
    const { requestPasswordReset } = useContext(AuthContext);
    const [message, setMessage] = useState(null)
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const username = e.target.username.value
        try {
            const result = await requestPasswordReset(email,username);
            alert(result.message);
            setMessage("Email sent! Please visit your mailbox to reset password.")
            navigate('/')
        } catch (error) {
            setMessage(error.message)
        }
    };

    return (
        <div className='flex-1 p-4 flex-col justify-center item-center gap-3 sm:gap-4'>
        <form className='max-w-prose w-full mx-auto p-4 flex flex-col justify-center item-center gap-3 sm:gap-4' onSubmit={handleSubmit}>
            <input className="px-3 py-1 border border-slate-400 rounded-lg hover:border-blue-400" type="text" name="username" placeholder="Username" />
            <input className="px-3 py-1 border border-slate-400 rounded-lg hover:border-blue-400" type="email" name="email" placeholder="Email" required />
            <button className="px-3 py-1 border items-center bg-white shadow rounded-lg tracking-wide text-lg text-slate-400 hover:text-blue-500 duration-200" type="submit">Reset</button>
        </form>
        {message && 
        
        <h3 className="text-sm text-center text-slate-300 mt-5">{message}</h3>

        }
        </div>
    );
};

export default Reset;