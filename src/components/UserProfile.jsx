// src/UserProfile.jsx
import React, { useContext,useEffect,useState,useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { Link,useNavigate } from 'react-router-dom';
import Header from './Header.jsx'
import ResetProfile from './ResetProfile.jsx';
import Upload from './Upload.jsx';
import {API_URL} from '../api'
import axios from "axios";
import Title from './Title.jsx';
import { motion } from "framer-motion"
import '../index.css'
import { jwtDecode } from "jwt-decode"
import ReactAudioPlayer from 'react-audio-player';
import {getRandomColor,getRandomShape} from '../api'


const UserProfile = () => {
    const token = localStorage.getItem('token');
    const { user, logout, showResetProfilePopup,setShowResetProfilePopup,tab,setTab } = useContext(AuthContext);
    const [handleFilePopup, setHandleFilePopup] = useState(false);
    const [handleTitlePopup, setHandleTitlePopup] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    // {"id": file.id, "filename": file.filename, "file_type": file.file_type, "path": file.file_path, "upload_time": file.upload_time}
    const [selectedTitle, setSelectedTitle] = useState(null);
    // {"conversation_id":t.id,"title":t.title,"started_at": t.created_at,"updated_at":t.updated_at}
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [error, setError] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showControls, setShowControls] = useState(false)
    const [openExpirePopup,setOpenExpirePopup] = useState(false)
    const controlsRef = useRef(null);
    // Recording
    const [duration, setDuration] = useState(0)
    const [recordingStatus, setRecordingStatus] = useState('inactive')
    const mediaRecorder = useRef(null)
    const intervalRef = useRef(null);
    const mimeType = 'audio/webm'
    const [audioChunks, setAudioChunks] = useState([]);
    const [audioLoading, setAudioLoading] = useState(false);

    // Convert to audio
    const [audioMap, setAudioMap] = useState({}); // 存储 msg.text -> { url, path }
    const [loadingMap, setLoadingMap] = useState({});
    const [intervals, setIntervals] = useState({});
    const [showConvertButtonMap, setShowConvertButtonMap] = useState({});
    
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const REFRESH_INTERVAL = 55 * 60 * 1000;
    const handleCloseDialog = () => {
        setOpenExpirePopup(false)
        logout()
    }
    
    // 转化为音频 ##############

    const handleShowConvertButton = (msgText) => {
        setShowConvertButtonMap((prev) => ({
            ...prev,
            [msgText]: !prev[msgText], // 让当前文本显示 Convert to Audio 按钮
        }));
    };

    const handleConvertToAudio = async (msgText) => {
        setLoadingMap((prev) => ({ ...prev, [msgText]: true }));
        try {
            const response = await fetch(`${API_URL}/users/convert-audio`, {
                method: "POST",
                headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text: msgText }),
            });
            const data = await response.json();
            setAudioMap((prev) => ({
                ...prev,
                [msgText]: { url: data.tempourl, path: data.path },
            }));

            // 自动刷新 URL
            startUrlRefresh(msgText, data.path);

        } catch (error) {
            console.error("Error generating audio:", error);
        } finally {
            setLoadingMap((prev) => ({ ...prev, [msgText]: false }));
        }
    };

    const startUrlRefresh = (msgText, filePath) => {
        // 每 55 分钟自动请求新的 OSS 签名 URL
        const refreshInterval = setInterval(async () => {
            try {
                // 1️⃣ 发送请求到 FastAPI 服务器，获取新的签名 URL
                const response = await fetch(`${API_URL}/users/refresh-audio-url`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ file_path: filePath }),
                });
    
                // 2️⃣ 解析后端返回的 JSON 数据，获取新的音频 URL
                const data = await response.json();
    
                // 3️⃣ 更新前端的 audioMap，替换旧 URL
                setAudioMap((prev) => ({
                    ...prev,
                    [msgText]: { ...prev[msgText], url: data.tempourl },
                }));
    
            } catch (error) {
                console.error("Failed to refresh URL:", error);
                console.log("Failed to refresh URL:",error?.message)
            }
        }, 55 * 60 * 1000); // 55 分钟后执行（避免 1 小时过期）
    
        // 4️⃣ 记录这个定时器，方便组件卸载时清除
        setIntervals((prev) => ({
            ...prev,
            [msgText]: refreshInterval,
        }));
    };

    // const deleteAudioFiles = async () => {
    //     try {
    //         // Promise.allSettled()
    //         // 等待所有 Promise 任务（无论是成功还是失败）完成后，返回一个包含每个任务状态的数组。
    //         // 返回的数组每一项都是 { status: 'fulfilled' | 'rejected', value | reason }。
    //         const deletionResults = await Promise.allSettled(
    //             Object.values(audioMap).map(async ({ path }) => {
    //                 console.log("Attempting to delete file:", path);
    
    //                 const response = await fetch(`${API_URL}/users/delete-audio`, {
    //                     method: "POST",
    //                     headers: { "Content-Type": "application/json" },
    //                     body: JSON.stringify({ file_path: path }),
    //                 });
    
    //                 if (!response.ok) {
    //                     throw new Error(`Failed to delete file: ${response.statusText}`);
    //                 }
    
    //                 const data = await response.json();
    //                 console.log("Delete successful:", data);
    //                 return data;
    //             })
    //         );
    
    //         // 处理每个异步任务的状态
    //         deletionResults.forEach((result, index) => {
    //             if (result.status === "rejected") {
    //                 console.error(`Failed to delete file #${index}:`, result.reason);
    //             }
    //         });
    //     } catch (error) {
    //         console.error("Failed to delete audio files:", error);
    //     }
    // };
    

    // // 页面卸载时清除 OSS 音频 & 清理定时器
    // useEffect(() => {
    //     return () => {
    //         if (Object.keys(audioMap).length > 0) {
    //             console.log("Audio files exist, attempting to delete...");
    //             Object.values(intervals).forEach(clearInterval);
    //             (async () => {
    //                 await deleteAudioFiles();
    //                 console.log("Audio files deletion complete.");
    //             })();
    //         }
    //     };
    // }, [audioMap]);
    const audioMapRef = useRef(audioMap);
    useEffect(() => {
        audioMapRef.current = audioMap;  // 确保实时更新
    }, [audioMap]); 

    const deleteAudioSync = () => {
        Object.values(audioMapRef.current).forEach(({ path }) => {
            console.log("AUDIO PATH",path)
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_URL}/users/delete-audio`, false);  // 第三个参数 false 使请求同步
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({ file_path: path }));
    
            if (xhr.status === 200) {
                console.log("删除成功:", JSON.parse(xhr.responseText));
            } else {
                console.error("删除失败:", xhr.statusText);
            }
        });
    };

    useEffect(() => {
    
        return () => {
            console.log('DELETING AUDIO...')
            console.log('卸载audiomap',audioMapRef.current)
            deleteAudioSync();
        };
    }, []);
    

    // 批量上传 ################

    const [batchUploadStatus,setBatchUploadStatus] = useState("")

    const handleFileChange = (e) => {
        const files = e.target.files; // 获取用户选择的文件
        if (files.length > 0) {
            handleFileUpload(files);
        }
    };

    const triggerFileInput = () => {
        document.getElementById("filesInput").click();
    };

    const handleFileUpload = async (files) => {
        if(files.length === 0){
            return;
        }
        const formData = new FormData();
        Array.from(files).forEach(file => {formData.append("files",file)})
        
        let newMessages
        // ✅ axios 会自动解析 JSON
        // const response = await axios.post(...);
        // console.log(response.data.conversation_id);
        try{
            setBatchUploadStatus("Uploading...")
            const response = await axios.post(
                `${API_URL}/users/batchuploads`,
                formData,
                {
                    headers:{
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            console.log("Response data:",response.data)
            if (response.data.length > 0){
                setSelectedFiles(response.data)
                // 使用 Promise.all() 来等待所有文件的 tempourl 转换成 objectURL。

                newMessages = response.data.map((item) => ({
                    role: 'user',
                    text: item.filename,
                    type: item.file_type,
                    path: item.path,
                    tempourl: item.tempourl
                }));
                if (newMessages.length > 0) {
                    setMessages((prevMessages) => [...prevMessages, ...newMessages]);
                  }
                    
                setBatchUploadStatus("Upload Succeed");
            }
        } catch (error) {
            setBatchUploadStatus("Upload Failed: " + (error?.response?.data?.detail || error.message));
        }
        console.log("newMessage:",newMessages)
        if (newMessages.length > 0) {
            try{
                const response = await axios.post(`${API_URL}/users/batchuploads-updateconversation`, 
                    {
                        conversation_id:selectedTitle ? selectedTitle.conversation_id : conversationId,
                        dict_to_be_add: newMessages
                    },
                    {
                        headers: {
                            // 由于 Content-Type: application/json，数据会被 JSON 序列化，变成 标准 JSON 格式 传输到后端。
                            // 后端 pydantic 自动解析 JSON
                            // List[dict] 告诉 pydantic 这个字段应该是一个 字典的列表。
                            // FastAPI 自动解析 JSON，并将 dict_to_be_add 解析为 Python list，其中的元素是 dict（字典）。
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                setConversationId(response.data.conversation_id)    
                } catch (e) {
                console.log("Failure at setting conversation_id when upload in batch: ",e.message)
                }
            }
        }
    
    console.log("USERPROFILE selectedFiles: ",selectedFiles)
    console.log("USERPROFILE messages: ",messages)
    console.log("batchUploadStatus: ",batchUploadStatus)

    //  RECORDING DOWN ##############

    async function startRecording(){
        let tempStream
        console.log('start recording')
        try {
            // 获取用户的音频流 
            const streamData = await navigator.mediaDevices.getUserMedia({
                audio:true,
                video:false
            })
            // 声明和设置录制流
            tempStream = streamData
        } catch (err) {
            console.log(err.message)
            return
        }
        setRecordingStatus('recording')
        // 指定音频录制的 MIME 类型, 创建一个新的 MediaRecorder 实例
        const media = new MediaRecorder(tempStream,{type:mimeType})
        // mediaRecorder 在组件的整个生命周期中始终引用相同的 MediaRecorder 实例。
        mediaRecorder.current = media


        mediaRecorder.current.start()
        let localAudioChunks = []
        mediaRecorder.current.ondataavailable = (event) => {
            if (typeof event.data === 'undefined'){return}
            if (event.data.size === 0){return}
            localAudioChunks.push(event.data)
        }
        setAudioChunks(localAudioChunks)
        intervalRef.current = setInterval(() => {
            setDuration((prev) => prev + 1);
        }, 1000); 
    }


    async function stopRecording(){
        setRecordingStatus('inactive')
        console.log('stop recording')
        if (!mediaRecorder.current) return;
        mediaRecorder.current.stop()
        clearInterval(intervalRef.current);
        setDuration(0); 
        // new Blob(audioChunks, { type: mimeType })：Blob 构造函数将 audioChunks 数组中的所有音频数据块合并成一个完整的二进制大对象（Blob）。
        // { type: mimeType }：指定了音频的 MIME 类型（如 audio/webm 或 audio/wav），这个类型决定了音频文件的格式。
        mediaRecorder.current.onstop = async () => {
            const audioBlob = new Blob(audioChunks, {type: mimeType})
            const audioFile = new File([audioBlob], "recording.webm", { type: mimeType });
            setAudioChunks([])
            setAudioLoading(true);
            try{
                const formData = new FormData();
                formData.append("audiofile", audioFile);
                console.log('audioFile::',audioFile)
                const response = await axios.post(`${API_URL}/users/chataudioinput`, formData,
                    {
                        headers: {
                            // 由于 Content-Type: application/json，数据会被 JSON 序列化，变成 标准 JSON 格式 传输到后端。
                            // 后端 pydantic 自动解析 JSON
                            // List[dict] 告诉 pydantic 这个字段应该是一个 字典的列表。
                            // FastAPI 自动解析 JSON，并将 dict_to_be_add 解析为 Python list，其中的元素是 dict（字典）。
                            'Content-Type': 'application/form-data',
                            Authorization: `Bearer ${token}`,
                        }
                    }
                )
                    console.log('AUDIO RESPONSE:', response)
                    setInput(response.data.text || '')    
                } catch (e) {
                    console.log("Failure at transcribing audio as input: ",e.message)
                } finally {
                    setAudioLoading(false)
                }
            }
        }

    //  useEffect ##############

    useEffect(() => {
        const checkTokenExpiration = () => {
            const token = localStorage.getItem('token')
            if(token) {
                try {
                    const decodedToken = jwtDecode(token);
                    const currentTime = Date.now() / 1000;
                    const expirationTime = decodedToken.exp;
                    console.log("Expiration: ", expirationTime)
                    if (currentTime >= decodedToken.exp){
                        setOpenExpirePopup(true);
                    }
                } catch (error) {
                    console.error("Decode Error: ", error)
                }
            }
        }
        const interval = setInterval(checkTokenExpiration,1000*60);
        return () => clearInterval(interval);
    },[navigate])

    useEffect(() => {
        function handleClickOutside(event) {
            if (controlsRef.current && !controlsRef.current.contains(event.target)) {
                setShowControls(false);
            }
        }

        if (showControls) {
            document.addEventListener("click", handleClickOutside);
        } else {
            document.removeEventListener("click", handleClickOutside);
        }

        return () => document.removeEventListener("click", handleClickOutside);
    }, [showControls]);
    const handleRedBarClick = (event) => {
        // 阻止事件冒泡，防止点击红条时事件继续冒泡到 document
        event.stopPropagation();
        setShowControls(true);
    };
    
    function handleClosePopup() {
        setShowResetProfilePopup(false);
        setHandleFilePopup(false);
        setHandleTitlePopup(false)
    }
    function toggleFilePopup(){
        setHandleFilePopup(!handleFilePopup)
    }
    function toggleTitlePopup(){
        setHandleTitlePopup(!handleTitlePopup)
    }

    const handleRefresh = () => {
        setConversationId(null)
        setSelectedFiles([])
        setSelectedTitle(null)
        setInput('')
        setError(null)
        setLoading(false)
        setMessages([])
    }

    useEffect(() => {
        if (selectedTitle && selectedTitle.conversation_id && selectedTitle.conversation_id !== conversationId){
        setConversationId(selectedTitle.conversation_id)}
        else{
            setConversationId(null)
        }
    }, [selectedTitle]); 



    // // 一次性输出
    // const handleSubmit = async () => {
    //     if (!input.trim()) return;
    //     setLoading(true);
        
    //     axios.post(`${API_URL}/users/chat`, {
    //     conversation_id:selectedTitle ? selectedTitle.conversation_id : null,
    //     message: input,
    //     files: selectedFiles.length >0 ? selectedFiles : [],  // 传递包含多个文件的信息
    //     },
    //     {
    //         headers: {
    //             'Content-Type': 'application/json',
    //             Authorization: `Bearer ${token}`,
    //         },
    //     })
    //     .then((response) => {
    //       // 处理响应
    //     if (!conversationId) setConversationId(response.data.conversation_id);
    //     // 将用户消息和 AI 回复加入消息列表
    //     setMessages([...messages, { role: 'user', text: input }, { role: 'ai', text: response.data.reply }]);
    //     setInput('');
    //     setLoading(false);
    //     })
    //     .catch((error) => {
    //     // 处理错误
    //     console.error(error);
    //     })
    //   };

    console.log("select title:",selectedTitle)

    // ######################

    const handleSubmitImage = async () => {
        if (!input.trim()) return;
    
        setLoading(true);
        setMessages((prev) => [...prev, { role: 'user', text: input }]);
        try {
            
            // 发起请求
            // ❌ fetch() 不会自动解析 JSON
            // const response = await fetch(...);
            // const responseData = await response.json();
            // console.log(responseData.conversation_id);
            const response = await fetch(`${API_URL}/users/chatimage1`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    conversation_id: selectedTitle ? selectedTitle.conversation_id : conversationId,
                    message: input,
                }),
                credentials: "include"
            });
            // 检查响应体
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            if (!response.body) {
                throw new Error("No response body received");
            }
            let newconversationId
            if (response.headers.has('X-Conversation-ID')) {
            newconversationId = response.headers.get('X-Conversation-ID');
            console.log("响应头：", newconversationId);  // 这里会输出有效的 conversation_id
            setConversationId(newconversationId);
            } else {
                console.error("No X-Conversation-ID in response headers");
            }
    
            // 获取流读取器
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let aiMessage = "";
    
            // 设置初始空的 AI 消息
            setMessages((prev) => [...prev, { role: "ai", text: "" }]);
    
            // 逐步读取流数据
            while (true) {
                try {
                    const { value, done } = await reader.read();
                    if (done) break; // 如果流结束，退出循环
    
                    const chunk = decoder.decode(value, { stream: true });
                    aiMessage += chunk;
    
                    // 更新 AI 消息
                    setMessages((prevMessages) =>
                        prevMessages.map((msg, index) =>
                            index === prevMessages.length - 1 ? { ...msg, text: aiMessage } : msg
                        )
                    );
                } catch (streamError) {
                    setError("Stream reading failed: " + streamError.message)
                    console.log("Error during stream reading:", streamError)
                    throw streamError; // 抛出错误以终止操作
                }
            }
            console.log('AIMESSAGE',aiMessage)
            console.log('CONVERSATIONID',conversationId)
            const response_image = await fetch(`${API_URL}/users/chatimage2`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    conversation_id: newconversationId,
                    message: String(aiMessage),
                }),
                credentials: "include"
            });
            if (!response_image.ok) {
                throw new Error(`Server Error: ${response_image.status} - ${await response_image.text()}`);
            }
            const jsonResponse = await response_image.json();
            console.log("Server Response:", jsonResponse);
            console.log("RESPONSE IMAGE:",jsonResponse)
            console.log("RESPONSE IMAGE URL:",jsonResponse.tempourl)
            setMessages((prevMessages) =>
                prevMessages.map((msg, index) =>
                    index === prevMessages.length - 1 ? { ...msg, tempourl: jsonResponse.tempourl,
                         path:jsonResponse.path, type:jsonResponse.type } : msg
                )
            );
            
            setLoading(false);
            setInput("");
        } catch (error) {
            // 捕获任何错误
            console.error("Error during chat request:", error);
            setError(error.message)
            setLoading(false);
            
        }
           
    };

    // ######################

    const handleSubmit = async () => {
        if (!input.trim()) return;
    
        setLoading(true);
        setMessages((prev) => [...prev, { role: 'user', text: input }]);
        console.log("selected file before:",selectedFiles)
        try {
            
            // 发起请求
            const response_ = await fetch(`${API_URL}/users/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    conversation_id: selectedTitle ? selectedTitle.conversation_id : conversationId,
                    message: input,
                    files: selectedFiles.length > 0 ? selectedFiles : [],
                }),
                credentials: "include"
            });
            console.log("selected file after",selectedFiles)
            console.log('response json',response_)


            // 检查响应体
            if (!response_.ok) {
                throw new Error(`HTTP error! Status: ${response_.status}`);
            }
            if (!response_.body) {
                throw new Error("No response body received");
            }
            if (response_.headers.has('X-Conversation-ID')) {
            const newconversationId = response_.headers.get('X-Conversation-ID');
            console.log("$$$", newconversationId);  // 这里会输出有效的 conversation_id
            setConversationId(newconversationId);
            } else {
                console.error("No X-Conversation-ID in response headers");
            }
    
            // 获取流读取器
            
            const reader = response_.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let aiMessage = "";
    
            // 设置初始空的 AI 消息
            setMessages((prev) => [...prev, { role: "ai", text: "" }]);
    
            // 逐步读取流数据
            while (true) {
                try {
                    const { value, done } = await reader.read();
                    if (done) break; // 如果流结束，退出循环
    
                    const chunk = decoder.decode(value, { stream: true });
                    aiMessage += chunk;
    
                    // 更新 AI 消息
                    setMessages((prevMessages) =>
                        prevMessages.map((msg, index) =>
                            index === prevMessages.length - 1 ? { ...msg, text: aiMessage } : msg
                        )
                    );
                } catch (streamError) {
                    setError("Stream reading failed: " + streamError.message)
                    console.log("Error during stream reading:", streamError)
                    throw streamError; // 抛出错误以终止操作
                }
            }
            console.log("Messages After",messages)
            setLoading(false);
            setInput("");
        } catch (error) {
            // 捕获任何错误
            console.error("Error during chat request:", error);
            setError(error.message)
            setLoading(false);
            
        }
    };
    
    // ######################
   
    const fetchHistory = async () => {
        try {if (conversationId) {
          const res = await axios.get(`${API_URL}/users/history`, 
            
            {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            params:{ conversation_id: conversationId },
            });
            console.log("触发fetchHistory，重设conversationId")
            // axios 自动解析 JSON，将它转换为 JavaScript 对象数组，存入 messages：
            // 所以 messages 里的每个元素是一个 JavaScript 对象，可以直接用 . 访问：
            setMessages(res.data);
            }
        } catch (error){
            console.error("Error fetching Conversations:", error);
            setError(error.message)
            setMessages([]);
        }
    }
    
    // ######################

    useEffect(() => {
        if (conversationId){
        fetchHistory();}
        else{
            setMessages([])
        }
        }, [conversationId]);

    useEffect(() => {

        if (!user) {
            
          navigate('/'); // 重定向到根目录
        }
      }, [user, navigate]); // 当 user 改变时执行

    useEffect(() => {
        // 定时刷新图片URL
        const refreshImageUrls = async () => {
            const updatedMessages = await Promise.all(
                messages.map(async (msg) => {
                    console.log("userprofile refresh:",msg,msg.path)
                    if ((msg.type && msg.type === "image") || (tab === "Image" && msg.role === 'ai' && msg.path)) {
                        try {
                            const response = await axios.get(`${API_URL}/users/refresh-url`, {
                                params: { path: msg.path }, // 发送 path 到后端
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            return { ...msg, tempourl: response.data.tempourl };
                        } catch (error) {
                            console.error("Failed to refresh image URL:", error);
                        }
                    }
                    return msg;
                })
            );
            setMessages(updatedMessages);
        };
        refreshImageUrls();

        // 每隔55分钟执行一次
        const interval = setInterval(refreshImageUrls, REFRESH_INTERVAL);

        return () => clearInterval(interval); // 组件卸载时清除定时器
    }, [tab]);

    // epilogue ##############
    
    if (!user) {
        return ;
    }
    console.log("@@:",messages,conversationId)
    console.log('@@@',audioMap)
    return (
        <div className='min-h-screen w-full bg-gradient-to-br from-white via-blue-200/50 to-white'>
            <div className="absolute inset-0 min-h-screen w-full bg-gradient-to-br from-red-200/50 via-white to-red-200/50 animate-pulse -z-10"></div>
            <Header></Header>
            {/* 选择任务模式 */}
            <div className="relative z-10">
                <button
                onClick={()=>setIsOpen(!isOpen)}
                className="absolute left-1/2 top-full -translate-x-1/2">
                    <i className={`fa-solid fa-chevron-down text-slate-300 hover:text-blue-300 text-xl -mt-1 duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}></i>
                </button>
                <motion.div
                animate={{ maxHeight: isOpen ? "4rem" : "0rem", opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute left-1/2 top-full mt-6 -translate-x-1/2 w-52 flex justify-center space-x-4 p-2 bg-white shadow-lg rounded-full bg-opacity-30 overflow-hidden"
                >
                {["Text", "Image", "Audio"].map((item) => (
                    <button
                    key={item}
                    onClick={() => {
                        handleRefresh()
                        setTab(item)}}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-lg ring-2 ring-white/50 transition-all duration-300 ${
                        tab === item ? "bg-blue-300" : "bg-slate-300 hover:bg-blue-300"
                    }`}
                    >
                    <i
                        className={
                        item === "Text"
                            ? "fa-solid fa-envelope-open-text"
                            : item === "Image"
                            ? "fa-solid fa-image"
                            : "fa-solid fa-file-audio"
                        }
                    ></i>
                    </button>
                ))}
                </motion.div>
            </div>
            
            
            {/* ------对话部分------ */}
            <div className="flex flex-col  mt-5 max-w-prose h-[85vh] rounded-xl mx-auto justify-center">
                <div className={`flex h-full bg-slate-200 mb-4 justify-center rounded-2xl items-center ${error && 'animate-pulse'}`}>
                {
                (error ? (<p className="p-2 text-xl text-center text-white">Error: {error}</p>) :
                (<div className="flex flex-col p-3 w-full max-h-[75vh] overflow-y-auto">
                    {/* {messages.map((msg, index) => (
                        <p 
                        key={index} 
                        className={`message p-2 items-center mb-2 ${msg.role === 'user' ? 'bg-blue-200 self-end rounded-xl rounded-br-none ml-40' : 'bg-orange-200 self-start rounded-xl rounded-bl-none mr-40'}`}
                        >
                            <span className="p-2 text-sm text-center text-slate-500">{msg.text}</span>
                        </p>
                    ))} */}
                    {messages.map((msg, index) => (
                    <div
                    key={index}
                    className={`message p-2 items-center mb-2 ${
                        msg.role === 'user'
                        ? 'bg-blue-200 self-end rounded-3xl rounded-br-none ml-40'
                        : 'bg-orange-200 self-start rounded-3xl rounded-bl-none mr-40'
                    }`}
                    onClick={() => handleShowConvertButton(msg.text)}
                    >
                    {!msg.type && (<span 
                    className="p-2 text-sm text-center text-slate-500"
                    >{msg.text}</span>)}

                    {audioMap[msg.text] && showConvertButtonMap[msg.text] && (
                        <div className="w-full p-2 rounded-full shadow-lg hover:bg-slate-200">
                        <ReactAudioPlayer
                            src={audioMap[msg.text]?.url}
                            controls
                            className="w-full h-8"
                        />
                        </div>
                    )}

                    {!audioMap[msg.text] && showConvertButtonMap[msg.text] && !loadingMap[msg.text] && (
                        <button
                            className="justify-center items-center text-blue-400 hover:text-blue-100  
                            bg-transparent hover:bg-orange-300 duration-300 rounded-full shadow-md w-6 h-6 m-1"
                            onClick={(event) => {
                                event.stopPropagation(); // 阻止事件冒泡
                                handleConvertToAudio(msg.text);
                            }}
                        >
                            <i className="text-sm fa-solid fa-headset"></i>
                        </button>
                    )}

                    {loadingMap[msg.text] && <p className="p-2 text-sm text-center text-slate-400 animate-pulse">Generating audio...</p>}

                    {msg.role === 'user' && msg.type === 'text' && (
                        // 文件夹样式 + 文件名
                        <div className="flex flex-col items-center">
                        <div
                            className="w-32 h-32 bg-yellow-500 text-white text-xl flex justify-center items-center rounded-lg"
                            style={{ boxShadow: '0 0 8px rgba(0,0,0,0.2)' }}
                        >
                            <i className="fa fa-folder"></i>
                        </div>
                        <span className="text-xs text-center mt-2">{msg.text}</span>
                        </div>
                    )}

                    {msg.role === 'user' && msg.type === 'image' && (
                        <div className="relative">
                        {/* {imageloading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                            <span></span>
                            </div>
                        )} */}
                        <img
                            // src={`${API_URL}/${msg.path}?t=${new Date().getTime()}`}
                            src={msg.tempourl}
                            className="w-64 h-auto object-cover rounded-lg "
                            alt="User uploaded"
                            
                        />
                        </div>
                    )}
                    {tab === "Image" && msg.role === 'ai' && msg.tempourl && (
                        <div className="relative">
                        {/* {imageloading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                            <span></span>
                            </div>
                        )} */}
                        <a href={msg.tempourl} download={`image_${new Date().getTime()}.jpg`} target="_blank" rel="noopener noreferrer">
                        <img
                            // src={`${API_URL}/${msg.path}?t=${new Date().getTime()}`}
                            src={msg.tempourl}
                            className="w-64 h-auto object-cover rounded-lg "
                            alt="Generated Image"
                            
                        />
                        </a>
                        </div>
                    )}
                    </div>
                ))}
                </div>))
                }
                </div>
                <div className="flex items-center justify-center w-full">

                    <div className='relative flex flex-grow'>
                        {audioLoading && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {/* inset-0 表示该容器会铺满父元素的宽高 */}
                                {/* pointer-events-none 防止这些纸屑元素阻塞其他可点击的元素（如按钮），即使它们存在于页面的上方 */}
                                {/* animate-[confetti-fall_2s_linear_infinite] 使用了你定义的 confetti-fall 动画，并且设置了动画的持续时间为 2 秒（2s），以及使用了 linear 缓动函数，使得纸屑下落的速度均匀。
                                infinite 表示动画将会循环执行，使得纸屑不断地掉落。 */}
                                {[...Array(35)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`absolute
                                                    ${getRandomShape()} 
                                                    ${getRandomColor()} 
                                                    animate-[confetti-fall_2s_linear_infinite]`}
                                        style={{
                                            left: `${Math.random() * 90}%`, 
                                            animationDelay: `${Math.random()}s`,
                                            top: `${Math.random() * 100}%`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        {/* Y 轴向上移动 10 像素，使纸屑一开始就出现在视口上方 */}
                        <style>
                            {`
                                @keyframes confetti-fall {
                                    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                                    100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
                                }
                            `}
                        </style>
                        <textarea
                            type="text"
                            className="flex-grow px-3 py-2 rounded-full bg-white resize-none break-words whitespace-pre-wrap"
                            placeholder="Type your message..."
                            value={input}
                            disabled={audioLoading}
                            rows={1}
                            onInput={(e) => {
                                e.target.style.height = "auto"; // 先重置高度
                                e.target.style.height = `${e.target.scrollHeight}px`; // 让高度等于内容高度
                                setInput(e.target.value);
                            }}
                            // style={{
                            //     background: audioLoading ? "linear-gradient(90deg, #ddd, #eee, #ddd)" : "white",
                            //     animation: audioLoading ? "wave 1.5s infinite" : "none",
                            // }}
                            // onChange={(e) => setInput(e.target.value)}
                        />
                        {/* 输入框按钮组 */}
                        <div className=" absolute flex right-3 top-1/2 transform -translate-y-1/2 cursor-pointer rounded-full gap-2">
                            <button onClick={recordingStatus==='recording' ? stopRecording : startRecording} className='flex items-center text-base justify-between max-w-full p-1 rounded-full'>   
                                <div className='flex items-center gap-2'>{duration !== 0 && (
                                    <p className='text-sm text-slate-300'>{duration}s</p>
                                )}
                                    <i className={'fa-solid duration-200 fa-microphone text-lg text-slate-300 hover:text-blue-300' + 
                                (recordingStatus === 'recording' ? 'text-rose-400 animate-pulse' : '')}></i>
                                </div>
                            </button>
                            {tab==='Text' && 
                            <div className='flex items-center text-base justify-between max-w-full p-1'>
                            <i className="fa-solid fa-plus text-lg text-slate-300 hover:text-blue-300" onClick={triggerFileInput}></i>
                            </div>
                            }
                        </div>

                    </div>
                    <button
                        onClick={tab === "Text" ? handleSubmit : (tab === "Image" ? handleSubmitImage : undefined)}
                        className="justify-center items-center text-slate-400 hover:text-blue-100 hover:border-blue-300 border-1 border-slate-300 
                        bg-blue-100 hover:bg-blue-300 duration-300 
                        rounded-full w-12 h-12 shadow-lg ring-2 ring-white/50 hover:ring-offset-2 disabled:bg-slate-200 ml-2 disabled:animate-pulse"
                        disabled={loading}
                    >
                        {loading ? <i className="text-sm sm:text-lg fa-solid fa-spinner animate-spin duration-1000"></i>
                         : <i className="text-sm sm:text-lg fa-solid fa-plane-departure transform scale-x-[-1]"></i>}
                    </button>
                    {/* 批量上传文件：隐藏的文件选择框 */}
                    {tab==='Text' && <input
                        id="filesInput" 
                        type="file" 
                        multiple
                        className="hidden"
                        onChange={handleFileChange}

                    />}
                    

                </div>

                {/* 控件组 */}
                <div className={`relative flex justify-start w-full ${showControls ? '' : 'mt-6'}`}>
                    {showControls ? (<div ref={controlsRef} className={`transition-all duration-1000 p-1 ease-in-out ${showControls ? 'max-h-30' : 'max-h-0'} overflow-hidden `}>
                        <div className={`flex justify-between gap-2 w-auto rounded-full`}>
                            {/* ------选择历史topic------ */}
                            <button className="justify-center items-center text-slate-400 hover:text-blue-100 hover:border-blue-300 border-1 border-slate-300 
                                bg-transparent hover:bg-orange-300 duration-300 
                                rounded-full shadow-md w-9 h-9 mt-1 mr-1 ring-offset-1 hover:ring-1"
                                onClick={toggleTitlePopup}
                                >
                                <i className="text-sm sm:text-lg fa-solid fa-list"></i>
                            </button>
                            {/* ------选择文档------ */}
                            <button className={`justify-center items-center text-slate-400 ${tab==="Text" ? 'hover:text-blue-100 hover:border-blue-300 hover:bg-orange-300 hover:ring-1' : ''}  item-center border-1 border-slate-300 
                                bg-transparent duration-300 rounded-full shadow-md w-9 h-9 mt-1 mr-1 ring-offset-1 `}
                                onClick={toggleFilePopup}
                                disabled={tab!=="Text"}
                                >
                                <i className="text-sm sm:text-lg fa-solid fa-book-atlas"></i>
                            </button>
                            {/* ------Refresh------ */}
                            <button className="justify-center items-center text-slate-400 hover:text-blue-100 hover:border-blue-300 border-1 border-slate-300 
                                bg-transparent hover:bg-orange-300 duration-300 
                                rounded-full shadow-md w-9 h-9 mt-1 mr-1 ring-offset-1 hover:ring-1"
                                onClick={handleRefresh}
                                >
                                <i className="text-sm sm:text-lg fa-solid fa-arrows-rotate"></i>
                            </button>
                        </div>
                    </div>) : (
                    <> 
                    <style>
                        {`
                        @keyframes colorChange {
                            0% { filter: hue-rotate(0deg); }
                            100% { filter: hue-rotate(360deg); }
                        }
                        `}
                    </style>
                    
                    <div
                    className="absolute left-1 bottom-1 flex w-1/3 h-2 rounded-full cursor-pointer 
                    bg-gradient-to-r from-blue-300 via-purple-500 to-pink-500 animate-[colorChange_3s_linear_infinite] opacity-50
                    hover:[animation-play-state:paused] hover:opacity-100"

                    onClick={handleRedBarClick}
                    />
                    
                    
                    </>
                    )}
                      
                </div>      
            </div>
            {/* ------基本信息------ */}
            {/* <div className="flex flex-col">
                <h2>User Profile</h2>
                <p>Username: {user.username}</p>
                <p>Email: {user.email}</p>
                <p>Nickname: {user.nickname}</p>
                <p>Description: {user.description}</p>
                <p>Picture: {user.picture}</p>
                <button onClick={logout}>Logout</button>
            </div> */}
            {/* ------------ */} 
            {handleTitlePopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={handleClosePopup}>
                    <div className="relative bg-white rounded-2xl shadow-lg w-11/12 sm:w-4/6 lg:w-1/2 p-2 bg-gradient-to-br from-white via-blue-200/50 to-white"
                    onClick={(e) => e.stopPropagation()}>
                        <Title togglepopup={toggleTitlePopup} setselectedtitle={setSelectedTitle} selectedtitle={selectedTitle}
                        selectedconversation={selectedConversation} setselectedconversation={setSelectedConversation}
                        ></Title>
                    </div>
                </div>
            )}
            
            {handleFilePopup &&
            (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={handleClosePopup}>
                <div className="relative bg-white rounded-2xl shadow-lg w-11/12 sm:w-4/6 lg:w-1/2 p-2 bg-gradient-to-br from-white via-blue-200/50 to-white"
                onClick={(e) => e.stopPropagation()}>
                    <Upload togglepopup={toggleFilePopup} setselectedfiles={setSelectedFiles} selectedfiles={selectedFiles}></Upload>
                </div>
                </div>
                ) 
            }
            
            {/* ------修改基本信息------ */}
            {showResetProfilePopup && 
            (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={handleClosePopup}>
                <div className="relative bg-white rounded-2xl shadow-lg w-11/12 sm:w-4/6 lg:w-1/2 p-3 bg-gradient-to-br from-white via-blue-200/50 to-white"
                onClick={(e) => e.stopPropagation()}>
                    <ResetProfile></ResetProfile>
                </div>
                </div>
            )}

            {/* token 过期弹窗 */}
            {openExpirePopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-2xl shadow-lg w-80 p-2 bg-gradient-to-br from-white via-blue-200/50 to-white"
                    >
                        <div className="flex flex-col w-full gap-2 sm:gap-3">
                            <p className="p-2 text-sm sm:text-md text-center text-slate-400 animate-pulse">Signature Expired, please login again.</p>
                            <button onClick={handleCloseDialog} className="px-1 py-1 border items-center bg-white shadow rounded-lg tracking-wide text-sm text-slate-400 hover:text-blue-500 duration-200">OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
// ----------

// file_type
// : 
// "text"
// filename
// : 
// "855011403.pdf"
// id
// : 
// 3
// path
// : 
// "uploads/text/855011403.pdf"
// upload_time
// : 
// "2025-02-09T06:49:01"
