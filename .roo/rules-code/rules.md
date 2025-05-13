# 网站开发规则

## 技术选型
开发始终使用context7以及cloudflare的mcp服务，记住使用context7,和cloudflare的MCP，也有gitgub的MCP
- **后端:** Node.js
- **前端:** React (使用 Next.js 框架)
- **数据库:** cloudflare 的KV D1 R2
  - KV 命名空间: jiazhuangai (ID: a120d00a55da47e682ad94852b8ab4cb)
  - D1 数据库: jiazhuangai (UUID: 69c4b792-fca3-48f6-a280-1c9977ed1dee)
  - R2 存储桶: jiazhuangai-files
- **