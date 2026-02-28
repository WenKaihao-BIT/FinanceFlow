# FinanceFlow 本地部署指南

FinanceFlow 是一个基于 React + Express + SQLite 的个人记账系统，支持可视化图表分析、Excel 导出以及 API 接口对接（可配合 OpenClaw 等 AI Agent 使用）。

## 📋 前置要求

在开始之前，请确保您的电脑已安装：

1.  **Node.js** (推荐 v18 或更高版本)
    *   下载地址: [https://nodejs.org/](https://nodejs.org/)
    *   验证安装: 打开终端输入 `node -v`，应显示版本号。

2.  **Git** (可选，用于克隆代码)
    *   下载地址: [https://git-scm.com/](https://git-scm.com/)

---

## 🚀 快速开始

### 1. 获取代码

如果您是从 AI Studio 导出代码，请解压压缩包。
或者，如果您已将代码上传到 GitHub，请克隆仓库：

```bash
git clone https://github.com/your-username/finance-flow.git
cd finance-flow
```

### 2. 安装依赖

在项目根目录下打开终端（Terminal 或 CMD），运行以下命令安装所需的库：

```bash
npm install
```

### 3. 配置环境变量 (可选)

虽然本项目核心功能（手动记账、API 接口、Excel 导出）**不需要**配置 API Key 即可使用，但如果您想保留网页端的 "AI 智能输入" 功能，需要配置 Gemini API Key。

1.  在项目根目录创建一个名为 `.env` 的文件。
2.  填入以下内容（如果不需要 AI 功能，可跳过此步）：

```env
# 可选：用于网页端 AI 智能记账功能
GEMINI_API_KEY=您的_Gemini_API_Key
```

### 4. 启动服务

运行以下命令启动开发服务器：

```bash
npm run dev
```

*   **访问地址**: 打开浏览器访问 [http://localhost:3000](http://localhost:3000)
*   **API 接口地址**: [http://localhost:3000/api/transactions](http://localhost:3000/api/transactions)

---

## 📦 数据管理

### 数据库文件
所有记账数据存储在项目根目录下的 `finance.db` 文件中（SQLite 数据库）。

*   **备份**: 定期复制 `finance.db` 文件到安全位置即可备份数据。
*   **迁移**: 如果更换电脑，只需将 `finance.db` 文件复制到新电脑的同名目录下即可恢复数据。

### Excel 导出
在网页端点击 "最近交易" 卡片右上角的 **"导出 Excel"** 按钮，即可下载所有交易记录的 `.xlsx` 文件。

---

## 🤖 对接 OpenClaw / AI Agent

如果您使用 OpenClaw 或其他 AI Agent 来自动记账，请配置以下 API 信息：

*   **接口地址**: `http://localhost:3000/api/transactions` (注意：本地部署时需确保 Agent 能访问您的局域网 IP，或使用内网穿透工具如 ngrok)
*   **请求方式**: `POST`
*   **Content-Type**: `application/json`
*   **数据格式**:

```json
{
  "type": "expense",      // 必填: "expense"(支出) 或 "income"(收入)
  "amount": 100.00,       // 必填: 金额 (数字)
  "category": "餐饮",     // 必填: 分类名称
  "date": "2024-03-20",   // 必填: 日期 (YYYY-MM-DD)
  "description": "午餐"   // 可选: 备注
}
```

---

## 🛠️ 常见问题

**Q: 启动时报错 `better-sqlite3` 相关错误？**
A: 这通常是因为 Node.js 版本不兼容或编译环境问题。请尝试删除 `node_modules` 文件夹和 `package-lock.json` 文件，然后重新运行 `npm install`。

**Q: 如何修改端口号？**
A: 打开 `server.ts` 文件，找到 `const PORT = 3000;`，修改为您想要的端口号（例如 8080），然后重启服务。

**Q: 数据丢失了？**
A: 请检查项目根目录下的 `finance.db` 文件是否存在。如果在 Docker 容器中运行，请确保挂载了数据卷 (Volume) 来持久化该文件。
