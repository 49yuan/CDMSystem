// 假设这是一个用于处理登录逻辑的服务文件  
export const login = async (username, password) => {
    // 这里应该是发送请求到后端API进行验证的逻辑  
    // 但由于时间紧迫和示例目的，这里直接返回一个模拟的响应  
    return new Promise((resolve) => {
        setTimeout(() => {
            if (username === 'admin' && password === 'password') { // 示例用户名和密码  
                resolve({ success: true, token: 'mock-admin-token', userType: 'administrator' });
            } else if (username === 'user' && password === 'password') {
                resolve({ success: true, token: 'mock-user-token', userType: 'user' });
            } else {
                resolve({ success: false });
            }
        }, 1000);
    });
};