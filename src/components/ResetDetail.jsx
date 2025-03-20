import React from 'react'
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useContext,useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ResetDetail = () => {
    const { resetPassword } = useContext(AuthContext);
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");
    const [resetStatus,setResetStatus] = useState(null)
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newPassword = e.target.password.value;
        try {
            const result = await resetPassword(token, newPassword);
            console.log(result.message);
            setResetStatus(true)
            navigate('/')
        } catch (error) {
            setResetStatus(false)
            console.log("Error resetting password");
        }
    };

    return (
        <div className='flex flex-col justify-center items-center max-w-prose w-full mx-auto gap-24'>
        <h1 className='font-semibold text-5xl text-slate-400 sm:text-6xl md:text-7xl py-5'>Piece<span className="text-blue-400 bold">s</span></h1>
        <form className='w-full mx-auto p-10 flex flex-col rounded-2xl shadow-lg bg-slate-50 justify-center item-center gap-3 sm:gap-4' onSubmit={handleSubmit}>
            <input className="px-3 py-1 border border-slate-400 rounded-lg hover:border-blue-400" type="password" name="password" placeholder="Enter new password" required />
            <button className="px-3 py-1 border items-center bg-white shadow rounded-lg tracking-wide text-lg text-slate-400 hover:text-blue-500 duration-200" type="submit">Reset Password</button>
        </form>
        {!resetStatus && <h3 className="text-sm text-center text-slate-300">Reset failed, please try again!</h3>}
        <div class="flex items-center justify-center w-full">
        <div class="border-t border-slate-200 flex-grow max-w-[20%]"></div>
        <span class="mx-4 text-slate-200">.</span>
        <div class="border-t border-slate-200 flex-grow max-w-[20%]"></div>
</div>
        </div>


    );
};

export default ResetDetail;
