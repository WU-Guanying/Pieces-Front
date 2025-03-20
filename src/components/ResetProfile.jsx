import React from 'react'
import { useState,useContext,useEffect } from 'react'
import { AuthContext } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import {API_URL} from '../api'
import { useNavigate } from 'react-router-dom';


export default function ResetProfile() {
    const navigate = useNavigate();
    const {user,setShowResetProfilePopup,setUser,tempourl} = useContext(AuthContext);
    const token = localStorage.getItem('token');
    const [imageSrc, setImageSrc] = useState("");
    const [userData, setUserData] = useState({
        nickname: '',
        email: '',
        description: '',
        picture: null
    });
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    function handleOnClose(){
        setShowResetProfilePopup(false)
    }
    // 处理表单输入变化
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prevUser) => ({
            ...prevUser,
            [name]: value
        }));
    };

    // 提交表单更新用户数据
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData();
        formData.append(
            'user_update',
            JSON.stringify({
                nickname: userData.nickname || user.nickname,
                email: userData.email || user.email,
                description: userData.description || user.description,
            })
        );
        if (file) {
            formData.append('picture', file);
        }
        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }
        

        try {
            const response = await axios.post(
                `${API_URL}/users/me/reset`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            console.log('Profile updated 1:', response);
            console.log('Profile updated 2:', response.data);
            
            setUser(response.data)
            
            // localStorage.setItem('user', JSON.stringify(response.data));
            console.log('USER', user);
            
        } catch (error) {
            console.error('Error updating profile:', error.response?.data || error.message);
        } finally {
            setIsLoading(false)
        }
    };
    useEffect(() => {
        // 确保 tempourl 变化时更新 imageSrc
        if (tempourl) {
            setImageSrc(tempourl);
        } else {
            // setImageSrc(`${API_URL}/${user.picture}?t=${new Date().getTime()}`);
            setImageSrc('uploads/avatar/default_avatar.jpg')
        }
    }, [tempourl, user.picture]); // 依赖项数组：tempourl 变化或首次渲染时运行
    
    console.log("isLoading",isLoading)
    // console.log("PROFILE TEMPOURL:",user.tempourl) 
    console.log("PROFILE PICTURE:",user.picture)
       
  return (
        <div className='flex flex-col justify-center item-center gap-3 sm:gap-4 '>
            <div className="flex justify-between bg-slate-300 rounded-xl items-center shadow m-2 px-2 py-1">
                <h2 className="text-white text-md">Update Profile</h2>
                <i onClick={handleOnClose} className="fa-solid text-white fa-xmark hover:scale-110 hover:rotate-180 hover:text-blue-500 transition-transform duration-300"></i>
            </div>

            <form onSubmit={handleSubmit} className='w-full'>
                <div className="flex justify-between gap-4 w-full">
                <div className="flex p-4 flex-col justify-center item-center gap-3 sm:gap-4 w-4/6">
                    {/* <label>Nickname:</label> */}
                    <input
                        className="px-3 py-1 border border-slate-400 rounded-xl hover:border-blue-400 bg-transparent focus:ring-2 hover:ring-blue-300 "
                        type="text"
                        name="nickname"
                        value={userData.nickname}
                        onChange={handleChange}
                        placeholder={user.nickname ? user.nickname : "Nickname"}
                    />
               
                    {/* <label>Email:</label> */}
                    <input
                        className="px-3 py-1 border border-slate-400 rounded-xl hover:border-blue-400 bg-transparent focus:ring-2 focus:ring-blue-300"
                        type="email"
                        name="email"
                        value={userData.email}
                        onChange={handleChange}
                        placeholder={user.email ? user.email : "Email"}
                    />
                
                    {/* <label>Description:</label> */}
                    <textarea
                        className="px-3 py-1 border border-slate-400 rounded-xl hover:border-blue-400 bg-transparent focus:ring-2 focus:ring-blue-300"
                        name="description"
                        value={userData.description}
                        onChange={handleChange}
                        placeholder={user.description ? user.description : "Description"}
                    />
                </div>
                <div className="relative flex justify-center hover:border-blue-300 item-center border-3 border-slate-300 rounded-full shadow-lg w-32 h-32 mt-3 mr-3 ring-offset-2 hover:ring-4">
                    {/* <label>Profile Picture:</label> */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        id="profile-picture-upload"
                    />
                    {imageSrc ? (
                        <img
                        src={imageSrc}
                        alt="Current Profile"
                        className="w-full h-full object-cover rounded-full"
                    />
                        ) : 
                    (<div className="w-full h-full flex items-center justify-center text-gray-500">
                        <i className="fa-solid fa-photo-film text-4xl opacity-60" />
                    </div>)
                    }
                    <div 
                    onClick={() => document.getElementById('profile-picture-upload').click()}
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-50 transition-opacity">
                    <i className="fa-solid fa-photo-film text-4xl text-white" />
                    </div>
                </div>
                </div>
                <button className="relative -left-3 my-2 rounded-r-full px-3 py-1 border items-center bg-white hover:bg-blue-100 shadow tracking-wide text-md text-slate-400 hover:text-blue-500 duration-200 " type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Updated'}
                </button>
            </form>
        </div>
  )
}

