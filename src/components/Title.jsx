import React from 'react'
import { useState,useEffect } from "react";
import axios from "axios";
import {API_URL} from '../api'
import { data } from 'react-router-dom';

export default function Title(props) {
    // 选择一个topic来定位conversatioId，进而来执行fetchTitle
    const token = localStorage.getItem('token');
    const {togglepopup,setselectedtitle, selectedtitle, selectedconversation, setselectedconversation} = props
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(false);
    // const [selectedConversation, setSelectedConversation] = useState(null);
    const [error, setError] = useState(null);
    const [editTitle, setEditTitle] = useState(null)
    const [editingConversationId, setEditingConversationId] = useState(null);
    
    const handleEdit = async (conversationId) => {
        if (!conversationId) {
            console.error("conversationId is undefined!");
            return;
        }
        if (!editTitle || editTitle.trim() === "") {
            console.error("Title is required and cannot be empty");
            return;
        }
        console.log("handleEdit called with conversationId:", conversationId, "and title:", typeof editTitle,editTitle);
        await axios.post(`${API_URL}/users/title-edit/${conversationId}`,
        { title:editTitle } ,//先更新数据库中的状态，该handleEdit由onBlur触发
        {
            headers:{
                'Content-Type': 'application/json',
                Authorization:`Bearer ${token}`,
            },
        }
        ).then((response) => {
        console.log("response data",response)
        setConversations(prevConversations => prevConversations.map(c =>
            c.conversation_id === conversationId ? {...c, title:response.data.title} : c))
        setReload(prev => !prev);// 刷新列表
        setEditingConversationId(null);// 结束编辑状态
        setEditTitle(null)})
        .catch((error) => {
            console.error("Error updating title:", error);
        })
        
            
    }
    // console.log("##",conversations,conversations[0].title)
    const handleDelete = (conversationId) => {
        axios.delete(`${API_URL}/users/conversations-delete/${conversationId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(() => {
        setConversations(conversations.filter(c => c.conversation_id !== conversationId));
        setselectedtitle(prev => prev && prev.conversation_id === conversationId ? null :prev)
        setReload(prev => !prev);
        
        })
        .catch(err => console.error("Delete failed:", err));
        };
    // 处理输入框中的标题变化
    const handleTitleChange = (e) => {
        setEditTitle(e.target.value);
    };

    
    useEffect(() => {
        setLoading(true)
        axios.get(`${API_URL}/users/conversations`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
        )
        .then((response) => {
            console.log("response data 1:",response.data)
            if (response.data.length === 0) {
            setConversations([]);  // 确保即使没有文件，files 也是空数组
            } else {
            setConversations(response.data);
            }
            })
        .catch((err) => {
            console.error("Request failed:", err);
            setError(err.message)})
        .finally(() => setLoading(false));
        }, [token,reload]);

    const handleSelectConversation = (conversation) => {
        console.log("ccccc",conversation)
        if (selectedconversation === conversation.conversation_id){
            // console.log("##########",selectedconversation,conversation.conversation_id)
            setselectedconversation(null)
            setselectedtitle(null)
        }else {
        // console.log("$$$$$$$$$$",selectedconversation,conversation.conversation_id)
        setselectedconversation(conversation.conversation_id); // 为单选提供信息
        setselectedtitle(conversation);  // 传递选中的对话信息
        }
    };
    
   console.log("#edittitle:",editTitle)
   console.log("#selectedconversation:",selectedconversation)
   console.log("#selectedTitle",selectedtitle)
  return (
    <div className="flex flex-col w-full gap-2 sm:gap-3">
        <div className="flex justify-between bg-slate-300 rounded-xl items-center shadow m-2 px-2 py-1"> 
            <h2 className="text-white text-md">My Conversation(s)</h2>
            <i onClick={togglepopup} className="fa-solid text-white fa-xmark hover:scale-110 hover:rotate-180 hover:text-blue-400 transition-transform duration-300"></i>
        </div>
        {loading ? <p className="p-2 text-sm sm:text-md text-center text-slate-400 animate-pulse">Loading...</p> : (
            error ? <p className="p-2 text-sm sm:text-md text-center text-slate-400">Error: {error}</p> : (
                conversations.length === 0 ? <p className="p-2 text-sm sm:text-md text-center text-slate-400 animate-bounce">- It's empty -</p> :
                (<ul className="list-none p-0">
                {conversations.map((conversation) => (
                    <li
                        key={conversation.conversation_id}
                        className={`flex justify-between items-center border-b py-2 text-slate-500 truncate cursor-pointer rounded-xl px-1 m-2 ${
                            selectedconversation === conversation.conversation_id ? 'bg-blue-200' : 'hover:bg-blue-200'
                        }`}
                        onClick={() => handleSelectConversation(conversation)}
                    >
                        <span className="max-w-[80%] truncate px-1 rounded-xl">
                            {editingConversationId === conversation.conversation_id ? (
                                <input
                                type="text"
                                value={editTitle || conversation.title}//在转移焦点之前，使用的是editTitle，在转移焦点之后，用的是conversation.title
                                onChange={handleTitleChange}
                                onBlur={() => handleEdit(conversation.conversation_id)}
                                ></input>
                            ) : (conversation.title)}
                        </span>
                        <div className="flex text-nowrap items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // 防止点击编辑按钮时选中该行
                                    setEditingConversationId(conversation.conversation_id);
                                    setEditTitle(conversation.title); 
                                }}
                                className="text-sm text-slate-400 opacity-70 hover:text-red-400 duration-200 px-2 py-1 mr-2"
                            >
                                <i className="fa-solid fa-pen-nib"></i>
                            </button>
                  
                            <button
                                className="text-sm text-slate-400 opacity-70 hover:text-red-400 duration-200 px-2 py-1"
                                onClick={(e) => {
                                    e.stopPropagation();  // 防止点击删除按钮时触发选中
                                    handleDelete(conversation.conversation_id);
                                }}
                            >
                                <i className="fa-solid fa-trash"></i> 
                            </button>
                        </div>
                    </li>
                ))}
            </ul>) 
            )
        )}
    </div>

    
);
}


// const handleEdit = async (conversationId) => {
//     console.log("handleEdit called with conversationId:", conversationId, "and title:", editTitle);

//     await axios.post(`${API_URL}/users/title-edit/${conversationId}`, null, { // 第二个参数设为 null（因为 POST 请求没有 body）
//         headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`,
//         },
//         params: { title: editTitle }  // 通过查询参数传递 title
//     })
//     .then((response) => {
//         console.log("response data", response);
//         setConversations(prevConversations => prevConversations.map(c =>
//             c.conversation_id === conversationId ? { ...c, title: response.data.title } : c
//         ));
//         setReload(prev => !prev); // 刷新列表
//         setEditingConversationId(null); // 结束编辑状态
//         setEditTitle(null);
//     })
//     .catch((error) => {
//         console.error("Error updating title:", error);
//     });
// };

// 方式	    前端 axios 请求	                 后端参数类型	                适用场景
// 查询参数	params: { title: editTitle }	title: str = Query(...)	     适用于简单参数
// 请求体	    { title: editTitle }	        request: TitleUpdateRequest	 适用于复杂数据