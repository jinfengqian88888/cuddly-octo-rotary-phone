# 体锻室预约系统 (Fitness Room Booking System)

> 一个轻量级的体锻室预约管理系统，支持预约、签到核销、管理端时段配置。

## 功能特性

- 📅 时段管理 — 管理员创建/管理可预约时段，支持批量创建
- 📝 在线预约 — 用户浏览可用时段并预约
- ✅ 签到核销 — 预约用户扫码/手动签到后方可进入体锻室
- 📊 管理后台 — 查看预约记录，手动核销/取消

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Ant Design 5 |
| 后端 | Node.js + Express |
| 数据库 | SQLite (MVP) → PostgreSQL (生产) |
| 鉴权 | JWT + bcrypt |

## 快速开始

```bash
# 后端
cd server
npm install
npm run dev

# 前端
cd client
npm install
npm run dev
```

## 项目结构

```
├── server/                # 后端 API 服务
│   └── src/
│       ├── routes/        # 路由定义
│       ├── controllers/   # 控制器逻辑
│       ├── models/        # 数据模型
│       ├── middleware/     # 中间件 (auth, role)
│       └── db/            # 数据库 schema & seed
├── client/                # 前端 React 应用
│   └── src/
│       ├── pages/         # 页面组件
│       ├── components/    # 通用组件
│       ├── services/      # API 调用
│       └── hooks/         # 自定义 Hooks
└── docs/                  # 项目文档
```

## 接口文档

详见 [docs/项目计划.md](docs/项目计划.md)

## License

MIT
