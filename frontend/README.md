# Vue前端部署说明

## 环境要求
- Node.js 16+
- npm 或 yarn

## 安装步骤

1. 安装依赖
```bash
npm install
```

或

```bash
yarn install
```

2. 配置后端API地址
- 在 `vite.config.js` 中修改后端代理地址（默认为 http://localhost:5000）

3. 运行开发服务器
```bash
npm run dev
```

访问：http://localhost:3000

4. 构建生产版本
```bash
npm run build
```

构建后的文件在 `dist` 目录中

## 功能说明

### 管理员功能
1. 登录页面：管理员使用账号密码登录
2. 充电数据页面：查看每日充电次数统计（折线图）和充电记录列表
3. 用户管理页面：查看所有用户信息、充电次数、余额等
4. 风险查看页面：查看每日报警次数统计（折线图）和报警记录列表

### 默认管理员账号
- 账号：admin
- 密码：admin123

## 技术栈
- Vue 3
- Vue Router
- Element Plus
- Axios
- ECharts
- Vite
