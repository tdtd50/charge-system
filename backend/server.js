const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const { initDatabase } = require('./database');
const { registerUser, loginUser, getUserById, getAllUsers } = require('./userModel');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'ev-charging-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // 开发环境设为 false，生产环境使用 HTTPS 时设为 true
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 小时
    }
}));
app.use(express.static(path.join(__dirname, '../frontend')));

// 数据存储路径
const DATA_FILE = path.join(__dirname, 'data', 'history.json');

// 确保数据目录存在
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// 初始化历史数据文件
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ records: [] }, null, 2));
}

// 系统状态
let systemState = {
    voltage: 0,        // 当前电压 (V)
    current: 0,        // 当前电流 (A)
    power: 0,          // 当前功率 (W)
    isCharging: false, // 充电状态
    status: 'idle',    // 系统状态: idle, charging, stopped, error
    errorMessage: '',  // 错误信息
    wifiConnected: true, // WiFi连接状态
    lastUpdate: new Date().toISOString()
};

// 模拟传感器数据更新
function updateSensorData() {
    if (systemState.isCharging) {
        // 模拟充电过程中的数据变化
        // 电压范围: 48V - 58V (电瓶车标准充电电压)
        systemState.voltage = (48 + Math.random() * 10).toFixed(2);

        // 电流范围: 2A - 5A (充电初期电流较大，后期减小)
        systemState.current = (2 + Math.random() * 3).toFixed(2);

        // 计算功率: P = U * I
        systemState.power = (systemState.voltage * systemState.current).toFixed(2);

        systemState.status = 'charging';

        // 模拟异常情况 (5% 概率)
        if (Math.random() < 0.05) {
            if (systemState.voltage > 57) {
                systemState.status = 'error';
                systemState.errorMessage = '电压过高，已停止充电';
                systemState.isCharging = false;
            } else if (systemState.current > 4.5) {
                systemState.status = 'error';
                systemState.errorMessage = '电流过大，已停止充电';
                systemState.isCharging = false;
            }
        }
    } else {
        // 未充电时的待机数据
        systemState.voltage = 0;
        systemState.current = 0;
        systemState.power = 0;

        if (systemState.status !== 'error') {
            systemState.status = systemState.status === 'stopped' ? 'stopped' : 'idle';
        }
    }

    systemState.lastUpdate = new Date().toISOString();
}

// 保存历史数据
function saveHistoryData() {
    if (systemState.isCharging && parseFloat(systemState.power) > 0) {
        try {
            const history = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

            const record = {
                timestamp: new Date().toISOString(),
                voltage: parseFloat(systemState.voltage),
                current: parseFloat(systemState.current),
                power: parseFloat(systemState.power),
                status: systemState.status
            };

            history.records.push(record);

            // 只保留最近1000条记录
            if (history.records.length > 1000) {
                history.records = history.records.slice(-1000);
            }

            fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));
        } catch (error) {
            console.error('保存历史数据失败:', error);
        }
    }
}

// 定时更新传感器数据 (每2秒)
setInterval(() => {
    updateSensorData();
    saveHistoryData();
}, 2000);

// 认证中间件
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: '请先登录'
        });
    }
}

// API 路由

// ============ 用户认证相关 API ============

// 用户注册
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: '请填写所有必填字段'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: '用户名至少需要3个字符'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码至少需要6个字符'
            });
        }

        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '邮箱格式不正确'
            });
        }

        // 注册用户
        const user = await registerUser(username, email, password);

        res.json({
            success: true,
            message: '注册成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(400).json({
            success: false,
            message: error.message || '注册失败'
        });
    }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请输入用户名和密码'
            });
        }

        // 验证用户
        const user = await loginUser(username, password);

        // 设置 session
        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({
            success: true,
            message: '登录成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(401).json({
            success: false,
            message: error.message || '登录失败'
        });
    }
});

// 用户登出
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '登出失败'
            });
        }
        res.json({
            success: true,
            message: '登出成功'
        });
    });
});

// 检查登录状态
app.get('/api/auth/check', async (req, res) => {
    if (req.session && req.session.userId) {
        try {
            const user = await getUserById(req.session.userId);
            if (user) {
                res.json({
                    success: true,
                    isAuthenticated: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                });
            } else {
                req.session.destroy();
                res.json({
                    success: true,
                    isAuthenticated: false
                });
            }
        } catch (error) {
            res.json({
                success: true,
                isAuthenticated: false
            });
        }
    } else {
        res.json({
            success: true,
            isAuthenticated: false
        });
    }
});

// 获取所有用户（需要登录）
app.get('/api/users', requireAuth, async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});

// ============ 充电系统相关 API ============

// 获取当前数据 (需要登录)
app.get('/api/data', requireAuth, (req, res) => {
    res.json({
        success: true,
        data: systemState
    });
});

// 控制充电 (需要登录)
app.post('/api/control', requireAuth, (req, res) => {
    const { action } = req.body;

    if (action === 'start') {
        if (systemState.status === 'error') {
            return res.json({
                success: false,
                message: '系统存在异常，请先排除故障'
            });
        }

        systemState.isCharging = true;
        systemState.status = 'charging';
        systemState.errorMessage = '';

        res.json({
            success: true,
            message: '充电已开启'
        });
    } else if (action === 'stop') {
        systemState.isCharging = false;
        systemState.status = 'stopped';
        systemState.errorMessage = '';

        res.json({
            success: true,
            message: '充电已停止'
        });
    } else if (action === 'reset') {
        // 重置错误状态
        systemState.isCharging = false;
        systemState.status = 'idle';
        systemState.errorMessage = '';

        res.json({
            success: true,
            message: '系统已重置'
        });
    } else {
        res.status(400).json({
            success: false,
            message: '无效的操作'
        });
    }
});

// 获取历史数据 (需要登录)
app.get('/api/history', requireAuth, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const history = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

        // 返回最近的N条记录
        const records = history.records.slice(-limit);

        res.json({
            success: true,
            data: {
                records: records,
                total: history.records.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '读取历史数据失败'
        });
    }
});

// 获取统计数据 (需要登录)
app.get('/api/statistics', requireAuth, (req, res) => {
    try {
        const history = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const records = history.records;

        if (records.length === 0) {
            return res.json({
                success: true,
                data: {
                    totalRecords: 0,
                    avgVoltage: 0,
                    avgCurrent: 0,
                    avgPower: 0,
                    maxPower: 0,
                    totalEnergy: 0
                }
            });
        }

        const totalVoltage = records.reduce((sum, r) => sum + r.voltage, 0);
        const totalCurrent = records.reduce((sum, r) => sum + r.current, 0);
        const totalPower = records.reduce((sum, r) => sum + r.power, 0);
        const maxPower = Math.max(...records.map(r => r.power));

        // 计算总能量 (简化计算: 每条记录代表2秒的数据)
        const totalEnergy = (totalPower * 2 / 3600).toFixed(2); // Wh

        res.json({
            success: true,
            data: {
                totalRecords: records.length,
                avgVoltage: (totalVoltage / records.length).toFixed(2),
                avgCurrent: (totalCurrent / records.length).toFixed(2),
                avgPower: (totalPower / records.length).toFixed(2),
                maxPower: maxPower.toFixed(2),
                totalEnergy: totalEnergy
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '计算统计数据失败'
        });
    }
});

// 清空历史数据 (需要登录)
app.delete('/api/history', requireAuth, (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ records: [] }, null, 2));
        res.json({
            success: true,
            message: '历史数据已清空'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '清空历史数据失败'
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
async function startServer() {
    try {
        // 初始化数据库
        await initDatabase();
        console.log('数据库初始化完成');

        app.listen(PORT, () => {
            console.log(`===========================================`);
            console.log(`电瓶车智能充电系统后端服务器已启动`);
            console.log(`访问地址: http://localhost:${PORT}`);
            console.log(`API 端点:`);
            console.log(`  认证相关:`);
            console.log(`  - POST /api/auth/register  用户注册`);
            console.log(`  - POST /api/auth/login     用户登录`);
            console.log(`  - POST /api/auth/logout    用户登出`);
            console.log(`  - GET  /api/auth/check     检查登录状态`);
            console.log(`  充电系统:`);
            console.log(`  - GET  /api/data           获取实时数据`);
            console.log(`  - POST /api/control        控制充电`);
            console.log(`  - GET  /api/history        获取历史数据`);
            console.log(`  - GET  /api/statistics     获取统计数据`);
            console.log(`===========================================`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

startServer();
