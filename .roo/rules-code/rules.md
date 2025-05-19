# 网站开发规则

## 技术选型
开发始终使用context7以及cloudflare的mcp服务，记住使用context7,和cloudflare的MCP，也有gitgub的MCP
- **后端:** Node.js
- **前端:** React (使用 Next.js 框架)
- **数据库:** cloudflare 的KV D1 R2
  - KV 命名空间: jiazhuangai (ID: a120d00a55da47e682ad94852b8ab4cb)
  - D1 数据库: jiazhuangai (UUID: 69c4b792-fca3-48f6-a280-1c9977ed1dee)
  - R2 存储桶: jiazhuangai-files
- **R2_BUCKET_NAME=jiazhuangai-files 
- **R2_ACCESS_KEY_ID=7522d5e5032c9356ddeb46bc6ef6cf05**
- **R2_SECRET_ACCESS_KEY=e38877dcd6cb3a4d7d1041197c88fe3d68c4630fa3fbbfda55892399f5c3f281**
R2_account_id=319de3339b3b7ef960bd9ecb563f33dd
https://pub-3dc6a89ae11b4f2bb35597920365df2d.r2.dev是存储桶的访问地址