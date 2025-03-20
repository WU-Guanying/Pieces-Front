import React from 'react'

export default function Button(props) {
const {text,func} = props
    return (
      
    <button onClick={func} 
    className='px-4 py-2 mx-auto border-[3px] rounded-full 
    border-solid border-blue-400 hover:border-blue-500 bg-white blueShadow duration-200'>
            <p className='text-blue-400 hover:text-blue-500 duration-200 text-2xl cursor-pointer'>{text}</p>
    </button>
  )
}
