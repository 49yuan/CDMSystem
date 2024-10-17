import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService'; // 假设authService.js中有login函数  

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await login(username, password);
        if (response.success) {
            // 登录成功，保存token或其他身份信息，并重定向到主页  
            localStorage.setItem('token', response.token);
            localStorage.setItem('userType', response.userType);
            navigate('/');
        } else {
            // 登录失败，显示错误信息  
            alert('登录失败，请检查用户名和密码');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className='form-group'>
                <label>用户名:</label>
                <input type="text" id="username" placeholder="请输入用户名" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className='form-group'>
                <label>密码:</label>
                <input type="password" id="password" placeholder='请输入密码' value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit">登录</button>
            <p>还没有账号？<a href='#'>注册</a></p>
            <p>忘记密码？<a href='#'>重置</a></p>
        </form>
    );
};

export default LoginForm;