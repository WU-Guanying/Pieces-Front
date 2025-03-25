import axios from 'axios';

// const API_URL = 'http://localhost:8000';
const API_URL = 'https://120.27.248.119';

const loginUser = async (credentials) => {
    try {
        const params = new URLSearchParams();
        // params.append('username', 'user1');
        // params.append('password', 'pass123');
        // 结果是：username=user1&password=pass123
        for (const key in credentials) {
            params.append(key, credentials[key]);
        }
        // 函数接受一个 credentials 对象（例如 { username: "user1", password: "pass123" }）。
        // 使用 URLSearchParams 将 credentials 转换为表单格式（application/x-www-form-urlencoded），这是许多 OAuth2 授权流程中需要的请求格式。

        const response = await axios.post(
            `${API_URL}/auth/token`,
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        // {
        //     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        //     "token_type": "bearer"
        // }
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

const registerUser = async (userData) => {
    try {
        await axios.post(`${API_URL}/auth/register`, userData);
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

const fetchUserProfile = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/users/me/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Fetch user profile error:", error);
        throw error;
    }
};


const requestPasswordReset = async (email,username) => {
    try {
    
        const response = await axios.post(`${API_URL}/auth/reset-request`, { email,username });
        
        return response.data;
    } catch (error){
        if (error.response){
            throw new Error(error.response.data.detail);
        } else {
            throw new Error('An unexpected error occurred');
        }
    } 
};

const resetPassword = async (token, newPassword) => {
    try {
        const response = await axios.post(`${API_URL}/auth/reset-confirm`, {
            token,
            new_password: newPassword,
        });
        return response.data;
    } catch (error) {
        console.error("Password reset error:", error);
        throw error;
    }
};

function getRandomColor() {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", 
      "bg-yellow-500", "bg-purple-500", "bg-pink-500",
      "bg-teal-500", "bg-indigo-500", "bg-orange-500"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // 🎨 随机形状函数
function getRandomShape() {
    const shapes = [
      "w-2 h-2 rounded-full",               // 圆形
      "w-3 h-3 bg-red-500 transform rotate-45", // 正方形
      "w-0 h-0 border-l-3 border-b-3 border-transparent border-t-3 border-r-3", // 三角形
      "w-3 h-3 bg-yellow-500 transform rotate-45 skew-x-12" // 不规则形状（通过 skew 倾斜）
    ];
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

export { loginUser, registerUser, fetchUserProfile,requestPasswordReset,resetPassword, API_URL,getRandomColor,getRandomShape};