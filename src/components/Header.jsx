import React from 'react'
import { useContext,useState,useRef,useEffect } from 'react';
import {Link} from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx';
import {API_URL} from '../api'

export default function Header() {
    const {user,logout,showResetProfilePopup,setShowResetProfilePopup,tempourl } = useContext(AuthContext);
    const [showLogoutPopup, setShowLogoutPopup] = useState(false)
    const [imageSrc, setImageSrc] = useState("");
    const logoutRef = useRef(null); // 用于引用 Logout 按钮
    const buttonRef = useRef(null); // 用于引用 fa-circle-xmark 按钮
    function handleToggleResetProfilePopup() {
        setShowResetProfilePopup(!showResetProfilePopup)
    }

   
    
    useEffect(() => {
        const handleClickOutside = (event) => {
          // 如果点击的地方不是 Logout 按钮或 fa-circle-xmark 按钮，则关闭 Logout 按钮
          if (
            logoutRef.current &&
            !logoutRef.current.contains(event.target) &&
            buttonRef.current &&
            !buttonRef.current.contains(event.target)
          ) {
            setShowLogoutPopup(false);
          }
        };
    
        // 监听整个页面的点击事件
        document.addEventListener("mousedown", handleClickOutside);
    
        // 清理监听器
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);

    useEffect(() => {
        // 确保 tempourl 变化时更新 imageSrc
        if (tempourl) {
            setImageSrc(tempourl);
        } else {
            // setImageSrc(`${API_URL}/${user.picture}?t=${new Date().getTime()}`);
            setImageSrc('uploads/avatar/default_avatar.jpg')
        }
    }, [tempourl, user.picture]); // 依赖项数组：tempourl 变化或首次渲染时运行
    
    
    function handleToggleLogoutPopup() {
        setShowLogoutPopup(!showLogoutPopup);
      }
    console.log("HEADER TEMPOURL:",user.tempourl) 
    console.log("HEADER PICTURE:",user.picture)  
  return (
    <div className="flex items-center p-4 justify-between gap-3 border border-slate-200">
        <div className="flex justify-center gap-3 items-center">
         <Link to="/profile"><h3 className='font-semibold text-sm text-slate-400 sm:text-lg md:text-xl hover:scale-110 transition-all duration-300'>Piece<span className="text-blue-400 bold">s</span></h3></Link>
            {user &&
                <h3 className='font-semibold text-sm text-slate-600 sm:text-lg md:text-xl hover:scale-110 transition-all duration-300 dancing-script'>{user.nickname ? user.nickname : user.username}</h3>
            }
            {imageSrc && 
                <img
                src={imageSrc}
                alt="Current Profile"
                className="w-5 sm:w-7 h-5 sm:h-7 object-cover rounded-full border-2 shadow-sm"
            />}
        </div>    
         {user && 
         <div className="flex relative items-center gap-6">
         <button onClick={handleToggleResetProfilePopup}><i className="fa-solid fa-gear hover:scale-110 hover:rotate-180 text-slate-400 hover:text-blue-500 transition-all duration-300 text-base sm:text-lg md:text-xl"></i></button>
         <button ref={buttonRef} className="text-slate-400 hover:text-blue-500 transition-all duration-300 text-base sm:text-lg md:text-xl" onClick={handleToggleLogoutPopup}>
            <i className="fa-regular fa-circle-xmark hover:scale-110 hover:rotate-180 transition-transform duration-300"></i>
        </button>
        {showLogoutPopup && <button ref={logoutRef} className="absolute text-sm right-0 text-white px-3 py-1 border rounded-full bg-blue-200 hover:bg-blue-300 duration-300"  onClick={logout}>Logout</button>}
        </div>}
    </div>
  )
}
