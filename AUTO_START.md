# FinanceFlow 开机自启动设置指南

## 方法一：启动文件夹（推荐，最简单）

1. 按 `Win + R`，输入 `shell:startup`，回车打开启动文件夹
2. 在该文件夹中右键 → 新建 → 快捷方式
3. 输入以下内容：
   ```
   cmd /k "cd /d D:\Projects\FinanceFlow && npm run dev"
   ```
   （注意：将路径改为你的实际项目路径）
4. 点击下一步，命名为 "FinanceFlow"
5. 完成

## 方法二：计划任务（更稳定）

1. 打开 "任务计划程序"
2. 创建基本任务
3. 名称填写 "FinanceFlow"
4. 触发器选择 "计算机启动"
5. 操作选择 "启动程序"
6. 程序脚本填写：
   ```
   cmd /c "cd /d D:\Projects\FinanceFlow && npm run dev"
   ```
7. 完成，勾选 "最高权限运行"（可选）

## 方法三：注册表

1. 按 `Win + R`，输入 `regedit` 回车
2. 导航到 `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
3. 新建字符串值，名称填写 `FinanceFlow`
4. 数值填写：
   ```
   cmd /c "cd /d D:\Projects\FinanceFlow && npm run dev"
   ```

---

## 使用说明

- 启动服务：`start.bat`
- 停止服务：`stop.bat`
- 启动后访问：http://localhost:3000
