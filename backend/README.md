# Flask后端部署说明

## 环境要求
- Python 3.8+
- MySQL 5.7+

## 安装步骤

1. 安装依赖
```bash
pip install -r requirements.txt
```

2. 配置MySQL数据库
- 创建数据库：`CREATE DATABASE charge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
- 修改 `config.py` 中的数据库连接信息（用户名、密码、主机、端口）

3. 初始化数据库
运行后端后，访问：http://localhost:5000/api/init

4. 运行服务
```bash
python app.py
```

服务将在 http://localhost:5000 启动

## 默认账号

### 管理员
- 账号：admin
- 密码：admin123

### 测试用户
- 学号：2021001
- 密码：123456
- 初始余额：100元

## API文档

### 管理员API
- POST `/api/admin/login` - 管理员登录
- GET `/api/admin/charge/list` - 获取充电订单列表
- GET `/api/admin/charge/statistics` - 获取每日充电统计
- GET `/api/admin/users` - 获取所有用户
- GET `/api/admin/risks` - 获取报警信息
- GET `/api/admin/risks/statistics` - 获取每日报警统计

### 用户API
- POST `/api/user/login` - 用户登录
- POST `/api/user/register` - 用户注册
- GET `/api/user/info/<user_id>` - 获取用户信息
- POST `/api/user/recharge` - 用户充值
- POST `/api/user/charge` - 创建充电订单
- GET `/api/user/orders/<user_id>` - 获取用户所有订单
- GET `/api/user/orders/charging/<user_id>` - 获取充电中订单
- GET `/api/user/orders/finished/<user_id>` - 获取已结束订单

### 硬件API
- GET `/api/hardware/status` - 获取当前充电状态
- POST `/api/hardware/alarm` - 上报报警信息
