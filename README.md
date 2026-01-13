# 电瓶车智能充电系统

## 简介
这是一个包含后端与前端的电瓶车智能充电管理系统示例工程。仓库里同时包含两个后端实现示例（Flask 与 Node/Express）和基于 Vue 3 + Element Plus 的管理后台前端。

主要用途：
- 管理员登录与管理（查看充电记录、用户、报警信息、统计）
- 用户端（小程序/接口）登录、注册、充值、发起充电订单
- 硬件接口：上报状态与报警（供 MCU / 芯片对接）

## 功能要点
- 管理员登录、用户管理、充电记录查看、统计图表
- 用户注册/登录/充值/下单（创建充电订单）
- 硬件上报当前状态与报警接口
- 使用 SQLite 作为本地开发数据库，便于本地快速运行

## 仓库结构（简要）
- `backend/` — 后端代码
  - `app.py` — Flask 实现的 API（默认监听 5000）
  - `config.py` — Flask 配置（包括 `SQLALCHEMY_DATABASE_URI`）
  - `models.py` — SQLAlchemy 模型（User, Order, Administer, Risk）
  - `requirements.txt` — Python 依赖
  - `server.js`, `database.js`, `userModel.js` — Node/Express 示例后端（监听 3000）
  - `data/` — Node 后端的 sqlite 数据文件（`users.db`、历史数据等）
- `frontend/` — 前端（Vue 3 + Vite）
  - `src/` — 源代码（`App.vue`, `main.js`, `api/index.js`, `views/*`）
  - `package.json` — 前端依赖与脚本
- `instance/` — 可能包含示例数据库 `dev.db`

## 快速开始（推荐本地开发流程）
请在包含 `backend/` 和 `frontend/` 的项目根目录下操作。

1) 准备环境
- Node.js >= 16, npm
- Python 3.8+

2) 启动 Flask 后端（用于小程序 API）

Windows (PowerShell):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# 可选：设置数据库连接（MySQL）
# $env:DATABASE_URI = 'mysql+pymysql://user:pass@host:port/dbname'
python app.py
```

Linux / macOS:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# export DATABASE_URI='mysql+pymysql://user:pass@host:port/dbname'
python app.py
```

- 默认 Flask 服务监听 `http://0.0.0.0:5000`。
- 本地默认使用 SQLite（`dev.db`），无需额外配置。
- 访问 `http://localhost:5000/api/init` 可初始化默认数据（管理员、测试用户）。

3) 或者启动 Node/Express 后端（项目里提供的另一套后端示例）
```bash
cd backend
npm install
npm start
```
- Node 后端默认监听 `http://localhost:3000`。
- Node 实现会把历史数据写入 `backend/data/history.json`，用户数据写入 `backend/data/users.db`（sqlite）。

4) 启动前端（管理后台）
```bash
cd frontend
npm install
npm run dev
```
- Vite 默认会在 `http://localhost:5173` 启动预览（终端会显示实际端口）。
- 前端通过 `src/api/index.js` 将请求发送到相对路径 `/api`。开发时可使用反向代理或同时启动后端并配置代理（或直接在同机上通过相对路径访问）。

## 环境与配置说明
- Flask 后端配置位于 `backend/config.py`：
  - `SQLALCHEMY_DATABASE_URI`：默认 `sqlite:///./dev.db`，可通过环境变量 `DATABASE_URI` 覆盖
  - `SECRET_KEY`：可通过环境变量 `SECRET_KEY` 覆盖
- Node 后端使用 `backend/data/users.db`（SQLite）与 `backend/data/history.json` 存储历史记录

## 主要 API 概览（Flask 后端）
（更多细节见代码注释）

管理员相关：
- POST `/api/admin/login` — 管理员登录（body: name, password）
- GET `/api/admin/charge/list` — 充电订单列表
- GET `/api/admin/charge/statistics` — 每日充电统计
- GET `/api/admin/users` — 获取所有用户
- GET `/api/admin/risks` — 获取报警记录
- GET `/api/admin/risks/statistics` — 每日报警统计

用户相关：
- POST `/api/user/login` — 用户登录（number, password）
- POST `/api/user/register` — 注册（name, number, password）
- GET `/api/user/info/<user_id>` — 获取用户信息
- POST `/api/user/recharge` — 充值（user_id, amount）
- POST `/api/user/charge` — 创建充电订单（user_id, cost）
- GET `/api/user/orders/<user_id>` — 获取用户所有订单
- GET `/api/user/orders/charging/<user_id>` — 获取正在充电订单
- GET `/api/user/orders/finished/<user_id>` — 获取已结束订单

硬件相关：
- GET `/api/hardware/status` — 获取当前充电状态（供硬件或 OLED 显示）
- POST `/api/hardware/alarm` — 硬件上报报警（body: reason）

Node 后端（server.js）提供的接口示例：
- POST `/api/auth/register` — 注册
- POST `/api/auth/login` — 登录
- POST `/api/auth/logout` — 登出
- GET `/api/data` — 获取系统状态（电压、电流、功率等）
- POST `/api/control` — 控制充电（start/stop/reset）
- GET `/api/history` — 获取历史记录
- GET `/api/statistics` — 获取统计数据

## 默认账号（用于开发/测试）
- 管理员：账号 `admin` / 密码 `admin123`
- 测试用户：学号 `2021001` / 密码 `123456`（初始余额示例为 100）

## 常见问题与提示
- 如果前端请求被 CORS 或代理问题阻挡：
  - 确保后端允许来自 `http://localhost:5173`（或前端运行端口）的跨域，或在 Vite 配置中设置开发代理。
- 切换到 MySQL：在 `backend/config.py` 设置 `DATABASE_URI` 为 `mysql+pymysql://user:pass@host:port/dbname`，确保 MySQL 服务可用并提前创建数据库（Flask app 中有一段尝试自动创建数据库的逻辑，但在生产环境请手动管理）。

## 贡献与许可
- 该仓库示例使用 MIT 许可（若需要请在仓库根添加 LICENSE 文件）。

---

