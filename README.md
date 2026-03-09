# FinanceFlow 财务管理系统 - 部署与 API 指南

FinanceFlow 是一个专为个人设计的轻量级财务管理系统，具备专业级的服务器监控面板、可视化图表分析以及强大的 API 接口。它采用本地 JSON 文件存储，非常适合私有化部署。

---

## 🚀 部署方法

### 1. 本地手动部署 (Windows/macOS/Linux)

1.  **安装 Node.js**: 确保您的系统已安装 Node.js (推荐 v18+)。
2.  **安装依赖**: 在项目根目录运行：
    ```bash
    npm install
    ```
3.  **启动服务**:
    *   **开发模式**: `npm run dev` (支持热重载)
    *   **生产模式**: `npm run build` 之后运行 `npm start`

### 2. Windows 一键启动 (推荐)

如果您在 Windows 环境下使用，可以直接使用根目录提供的批处理文件：
*   **启动服务**: 双击运行 `start.bat`。它会自动安装依赖并启动后台服务。
*   **停止服务**: 双击运行 `stop.bat`。

### 3. 云端部署 (Cloud Run / Docker)

本项目已适配 Google Cloud Run 等现代云平台。云端部署的逻辑如下：

1.  **构建 (Build)**: 运行 `npm run build`。这会将前端代码编译并打包到 `dist` 文件夹中。
2.  **启动 (Start)**: 云平台会自动运行 `npm start`。
3.  **服务 (Serve)**: `server.ts` 在生产模式下会自动识别 `dist` 文件夹，并将其作为静态资源提供给浏览器。
4.  **端口 (Port)**: 云平台通常要求服务监听 `3000` 端口，本项目已默认配置。
5.  **持久化 (Persistence)**: 
    *   在 AI Studio 的预览和分享环境中，`finance.json` 会被自动保留。
    *   如果您自行部署到标准的 Cloud Run，请注意容器是“无状态”的。建议将 `finance.json` 挂载到网络存储（如 Cloud Storage 或 Filestore），或者修改 `db.ts` 对接外部数据库（如 MongoDB/PostgreSQL）。

---

## 🤖 Agent API 接口说明

FinanceFlow 提供了完整的 RESTful API，方便对接 OpenClaw、Dify 或其他 AI Agent 实现自动化记账。

### 1. 记账接口 (Agent 核心)

*   **接口地址**: `/api/transactions`
*   **请求方式**: `POST`
*   **Payload**:
    ```json
    {
      "type": "expense",      // "expense" (支出) 或 "income" (收入)
      "amount": 50.5,         // 金额 (数字)
      "category": "餐饮",     // 分类
      "date": "2024-03-20",   // 日期 (YYYY-MM-DD)
      "description": "午餐"   // 备注 (可选)
    }
    ```

### 2. 财务摘要接口

*   **接口地址**: `/api/summary`
*   **请求方式**: `GET`
*   **返回**: 包含总收入、总支出和当前余额。

### 3. 系统与数据库状态

*   **接口地址**: `/api/system-info`
*   **请求方式**: `GET`
*   **返回**: 包含服务器 CPU、内存使用情况以及 `finance.json` 的文件大小、记录总数等。

### 4. 系统日志接口

*   **接口地址**: `/api/logs`
*   **请求方式**: `GET`
*   **返回**: 最近 50 条服务器运行日志（包含 API 调用记录）。

### 5. 数据导出接口

*   **接口地址**: `/api/export/excel`
*   **请求方式**: `GET`
*   **说明**: 直接触发浏览器下载生成的 `.xlsx` 财务报表。

---

## 📊 数据安全与维护

*   **数据存储**: 所有数据均存储在根目录的 `finance.json` 中。
*   **备份建议**: 定期导出 Excel 或手动备份 `finance.json` 文件。
*   **管理面板**: 登录系统后，点击左侧导航栏的 **"服务器状态"**，可以实时监控数据库健康状况并查看操作日志。

## 🛠️ 开发者说明

*   **前端**: React + Tailwind CSS + Lucide Icons
*   **后端**: Express.js + Vite Middleware
*   **存储**: 原生 JSON 文件操作 (db.ts)

如有任何问题，请查看服务器日志或联系系统管理员。
