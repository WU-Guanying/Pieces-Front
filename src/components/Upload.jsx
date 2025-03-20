import React from 'react'
import { useState,useEffect } from "react";
import axios from "axios";
import {API_URL} from '../api'
// sudo apt update
// sudo apt install -y ffmpeg

export default function Upload(props) {
    const {togglepopup,selectedfiles,setselectedfiles} = props
    const [selectedFile, setSelectedFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [uploadStatus, setUploadStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');
    const [chooseFile, setChooseFile] = useState(true)
    const [error, setError] = useState(null);
    const [reload, setReload] = useState(false);
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
        setSelectedFile(file);
        setChooseFile(false);  // 文件选中后切换为 "Upload"
            }
        };
    const handleUpload = async () => {
        if (!selectedFile) {
            alert("Please choose your file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        try {
            setUploadStatus("Uploading...");
            const response = await axios.post(
                `${API_URL}/users/uploads`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            console.log('Profile updated:', response.data);
            setUploadStatus("Upload Succeed: " + response.data.filename);
            setReload(prev => !prev);
            setChooseFile(true)
            // localStorage.setItem('user', JSON.stringify(response.data));
            
            
        } catch (error) {
  
            setUploadStatus("Upload Failed: " + error.response?.data.detail || error.message);
            setChooseFile(true)
            setSelectedFile(null)
        }
    }

    const handleDownload = (fileId, filename) => {
        axios.get(
            `${API_URL}/users/files-download/${fileId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob'
            })
          .then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data])); //后端返回的二进制文件数据。创建一个 Blob 对象，用于存储二进制数据。
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);//指定下载时的文件名。
            document.body.appendChild(link);//将 <a> 标签添加到 DOM（但不显示）。
            link.click();
          })
          .catch(() => alert("Download Falied."));
      };

    const handleDelete = (fileId) => {
        axios.delete(`${API_URL}/users/files-delete/${fileId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
          .then(() => {
            setFiles(files.filter(file => file.id !== fileId));
            setselectedfiles(prevs => prevs.filter(f => f.id !== fileId));
            
            setReload(prev => !prev);
            
          })
          .catch(err => console.error("Delete failed:", err));
      };

    useEffect(() => {
        setLoading(true)
        axios.get(`${API_URL}/users/files`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
        )
          .then((response) => {
            if (response.data.message === "No File Found.") {
            setFiles([]);  // 确保即使没有文件，files 也是空数组
            } else {
            setFiles(response.data);
            }
          })
          .catch((err) => setError(err?.response?.data?.detail))
          .finally(() => setLoading(false));
      }, [token,reload]);

    //   const handleRowClick = (fileId) => {
    //     setselectedfiles((prev) => {
    //       const newSelection = new Set(prev);
    //       if (newSelection.has(fileId)) {
    //         newSelection.delete(fileId);
    //       } else {
    //         newSelection.add(fileId);
    //       }
    //       return newSelection;
    //     });
    //   };

    // find 返回符合条件的 第一个元素（如果找到了），或者 undefined。
    // some 返回一个布尔值 true 或 false，表示是否存在符合条件的元素。
    const handleRowClick = (file) => {
        setselectedfiles((prevs) => {
          const exists = prevs.find((f) => f.id === file.id);
          if (exists) {
            // 取消选中
            return prevs.filter((f) => f.id !== file.id);
          } else {
            // 选中
            return [...prevs, file];
          }
        });
      };
    console.log("upload selectfile:", selectedfiles)
    console.log("files:", files)
    
  return (
    <div className="flex flex-col w-full gap-3 sm:gap-4">
      <div className="flex justify-between bg-slate-300 rounded-xl items-center shadow m-2 px-2 py-1"> 
        <h2 className="text-white text-md">My Files</h2>
        <i onClick={togglepopup} className="fa-solid text-white fa-xmark hover:scale-110 hover:rotate-180 hover:text-blue-400 transition-transform duration-300"></i>
      </div>

      {loading ? <p className="p-2 text-sm text-center text-slate-400">Loading...</p> : (
        <ul className="p-2 max-h-[200px] overflow-y-auto">
            {!loading && error && <p className="p-2 text-sm text-center text-slate-500">Error: {error}</p>}
          {(!loading && !error && files.length === 0) ? <p className="p-2 text-sm text-center text-slate-500">- It's empty -</p> : (
            files.map(file => {
            const isSelected = selectedfiles.some((f) => f.id === file.id);
            return (
              <li key={file.id} className={`flex justify-between items-center border-b py-2 text-slate-500 truncate cursor-pointer rounded-xl px-1 m-2
              ${isSelected ? "bg-blue-200" : "hover:bg-blue-200"}
              `}
              onClick={() => handleRowClick(file)}>
                <span className="max-w-[60%] truncate">{file.filename} ({file.file_type})</span>
                <div className="flex text-nowrap items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file.id, file.filename)}}
                    className="text-sm text-slate-400 opacity-70 hover:text-red-400 duration-200 px-2 py-1 mr-2"
                  >
                    <i className="fa-solid fa-download"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-sm text-slate-400 opacity-70 hover:text-red-400 duration-200 px-2 py-1"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </li>
            )})
          )}
        </ul>
      )}
      <div className="flex items-center w-full">
      <input type="file" onChange={handleFileChange} className="hidden" id="fileInput" />

      <div className="flex justify-center items-center w-full">
        <button className='m-2 px-2 py-1 border items-center bg-white shadow rounded-xl tracking-wide 
        text-sm text-slate-400 hover:text-blue-400 duration-200 w-1/3' onClick={() => {
            if (chooseFile) {
                setUploadStatus(null)
                document.getElementById('fileInput').click();  // 触发文件选择
                // setChooseFile(false);  // 切换为 "选择文件"
                
            } else {
                handleUpload();  // 上传文件
            }
        }}>{chooseFile ? "To Obtain Files" : "Upload"}
        </button>
        <div className="flex items-center w-2/3 border rounded-xl shadow m-2">
            {uploadStatus && <p className="p-2 text-sm text-center text-slate-400 break-words w-full">{uploadStatus}</p>}
        </div>
      </div>

      </div>
    </div>
  );
}
