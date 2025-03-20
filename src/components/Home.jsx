import React from 'react'
import {Link} from 'react-router-dom'
import { useState,useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext.jsx';
import Register from './Register'
import Login from './Login'
import Reset from './Reset'
export default function Home() {
  const { showResetPopup,setShowResetPopup } = useContext(AuthContext);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  function handleToggleRegisterPopup() {
    setShowRegisterPopup(!showRegisterPopup)
  }
  
  function handleToggleLoginPopup() {
    setShowLoginPopup(!showLoginPopup)
  }
  function handleClosePopup() {
    setShowRegisterPopup(false);
    setShowLoginPopup(false);
    setShowResetPopup(false)
  }
  console.log("##",showLoginPopup)
  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-blue-200/50 via-white via-50% to-blue-200/50'>
    <div className="relative flex-1 p-4 flex flex-col justify-center item-center text-center pb-20 max-w-prose w-full mx-auto gap-4 ">
      <div className={`flex flex-col justify-center item-center transform transition-all duration-500 ${
        showRegisterPopup || showLoginPopup || showResetPopup ? 'translate-y-0 scale-75' : 'translate-y-full scale-100'
      } space-y-16`}>
        <h1 className='font-semibold text-5xl text-slate-400 sm:text-6xl md:text-7xl'>Piece<span className="text-blue-400 bold">s</span></h1>
        {/* translate-x-1/2：将元素向右移动其自身宽度的 50%。 */}
        <div className="relative w-full">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-[90%] sm:w-[100%] md:w-[120%] h-0.5 bg-gradient-to-r from-slate-100 via-slate-400 to-slate-100 animate-pulse"
          style={{ backgroundSize: '100% 10px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}></div>
        </div>
        <div className="grid grid-cols-[1fr_minmax(2px,1px)_1fr] mx-auto items-center bg-white shadow-lg rounded-full overflow-hidden">
          <button onClick={handleToggleRegisterPopup} className={'px-6 py-1 text-lg sm:text-xl md:text-2xl '+`${showRegisterPopup ? 'text-blue-300':'text-slate-300'}`+' hover:text-blue-300 duration-200'}>register</button>
          <div className="text-slate-400 text-opacity-25">|</div>
          {/* <Link to="/login"><button className='px-6 py-1 text-lg sm:text-xl md:text-2xl text-slate-400 hover:text-blue-500 duration-200'>Sign in</button></Link> */}
          <button onClick={handleToggleLoginPopup} className={'px-6 py-1 text-lg sm:text-xl md:text-2xl '+`${showLoginPopup ? 'text-blue-300':'text-slate-300'}`+' hover:text-blue-300 duration-200'}>login</button>
        </div>
      </div>
      {showRegisterPopup && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={handleClosePopup}>
        <div className="relative bg-white p-8 rounded-2xl shadow-lg w-96"
        onClick={(e) => e.stopPropagation()}>
        <Register/>
        </div>
      </div>)}
      {showLoginPopup && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={handleClosePopup}>
        <div className="relative bg-white p-8 rounded-2xl shadow-lg w-96"
        onClick={(e) => e.stopPropagation()}>
        <Login setLoginPopup={setShowLoginPopup}/>
        </div>
      </div>)}
      {showResetPopup && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={handleClosePopup}>
        <div className="relative bg-white p-8 rounded-2xl shadow-lg w-96"
        onClick={(e) => e.stopPropagation()}>
        <Reset/>
        </div>
      </div>)}           
    </div> 
    </div>
  )  
}


// inset-0 是 Tailwind CSS 中的一个快捷类，用于同时设置元素的 top、right、bottom 和 left 属性为 0。它的作用是让元素完全填满其包含块（通常是 position: relative 的父容器），在这里就是让遮罩层覆盖整个屏幕。
