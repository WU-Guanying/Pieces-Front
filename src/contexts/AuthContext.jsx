import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, fetchUserProfile, registerUser, requestPasswordReset,resetPassword} from '../api';
import axios from 'axios';
import {API_URL} from '../api'
const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [loginStatus, setLoginStatus] = useState(false)
    const [registerStatus, setRegisterStatus] = useState(false)
    const [showResetPopup, setShowResetPopup] = useState(false)
    const [showResetProfilePopup, setShowResetProfilePopup] = useState(false)
    const [tab,setTab] = useState("Text")//"Image" "Audio"
    const [tempourl, setTempourl] = useState('')
    function handleResetPopup() {
        setShowResetPopup(!showResetPopup)
    }
    

    useEffect(() => {
        if (token) {
            const getUser = async () => {
                const user = await fetchUserProfile(token);
                setUser(user);
            };
            getUser();
        }
    }, [token]);

    const login = async (username, password) => {
        const response = await loginUser({ username, password });
        try{
        if (response?.access_token) {
            setToken(response.access_token);
            localStorage.setItem('token', response.access_token);
            const userProfile = await fetchUserProfile(response.access_token);
            setUser(userProfile);
            navigate('/profile');
            return true;
        }else{
            return false;
        }}
        catch (error){
            if (error.response) {
                // Axios response error, could handle specific status codes here
                console.error("Response error:", error.response.data);
              } else if (error.request) {
                // Axios request error
                console.error("Request error:", error.request);
              } else {
                // Other errors
                console.error("Error:", error.message);
              }
              return false;
        }
        
        
    };
    // let tempourl;
    const refreshImageUrls = async () => {
        if (!user?.picture) return;
        if (user.picture === '/assets/avatar/default_avatar.jpg') return;
            try {
                const response = await axios.get(`${API_URL}/users/me/refresh-url-header`, {
                    params: { path: user.picture }, // 发送 path 到后端
                    headers: { Authorization: `Bearer ${token}` }
                });
                // tempourl = response?.data?.tempourl 
                setTempourl(response?.data?.tempourl)
                console.log("Front refresh tempo url:",response?.data?.tempourl)
            } catch (error) {
                console.error("Failed to refresh image URL:", error);
            }
        }
    useEffect(() => {
        if (user?.picture) {
            refreshImageUrls(); // 组件加载时先获取一次
            const interval = setInterval(refreshImageUrls, 55 * 60 * 1000); // 55 分钟刷新一次
            return () => clearInterval(interval); // 组件卸载时清除定时器
        }
    }, [user?.picture]);

    const register = async (username, email, password) => {
        try{
        await registerUser({ username, email, password });//检查是否返回错误，改变status
        setRegisterStatus(true)
        navigate('/');}
        catch (error){
            console.log("authcontext error: ",error)
            throw error;
        }
    };


    const logout = () => {
        setToken(null);
        setUser(null);
        setLoginStatus(false)
        setRegisterStatus(false)
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ token, user, setUser, login, register, logout, 
        requestPasswordReset,resetPassword,loginStatus,registerStatus,
        setLoginStatus,handleResetPopup,setShowResetPopup,showResetPopup,
        showResetProfilePopup,setShowResetProfilePopup, tab, setTab, tempourl}}>
            {children}
        </AuthContext.Provider>
    );
};

export {AuthProvider, AuthContext}