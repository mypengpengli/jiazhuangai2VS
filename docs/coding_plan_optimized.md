# 家装AI智库 - 优化编码计划 (AI 辅助开发版)

本文档基于《家装AI智库项目概述》和原始编码计划，针对 AI 辅助开发工具（如 Cursor）进行了优化，提供更细化、可操作的步骤。

**核心原则:** 每个编号步骤代表一个相对独立的、可由 AI 执行的任务单元。完成后应进行验证。

---

## 阶段一：环境搭建与数据库基础

**目标:** 搭建项目骨架，定义并创建数据库表结构。

**1. 前端项目初始化 (Next.js)**
    *   **任务:** 使用 `create-next-app` 在工作区根目录下创建名为 `frontend` 的 Next.js 项目。
    *   **指令示例:** `npx create-next-app@latest frontend` (根据 AI 工具的执行方式调整)
    *   **验证:** 确认 `frontend` 目录已创建，包含 Next.js 项目文件，且 `cd frontend && npm run dev` 能成功启动开发服务器。

**2. 后端项目初始化 (Node.js)**
    *   **任务:** 在工作区根目录下创建名为 `backend` 的 Node.js 项目目录，并初始化 `package.json`。
    *   **指令示例:** `mkdir backend && cd backend && npm init -y`
    *   **验证:** 确认 `backend` 目录和 `package.json` 文件已创建。

**3. 后端框架与基础依赖安装**
    *   **任务:** 在 `backend` 目录下安装基础依赖：`express` (或 `koa`), `@cloudflare/workers-types`, `wrangler` (作为 devDependency), `hono` (推荐，轻量级且适合 Workers)。
    *   **指令示例:** `cd backend && npm install hono @cloudflare/workers-types && npm install -D wrangler`
    *   **验证:** 检查 `backend/package.json` 的 `dependencies` 和 `devDependencies`。

**4. Cloudflare D1 数据库连接配置**
    *   **任务:** 在 `backend` 项目中配置 D1 数据库连接。通常通过 `wrangler.toml` 文件。
    *   **文件:** `backend/wrangler.toml`
    *   **内容:** 添加 D1 绑定配置，指向您的 `jiazhuangai` 数据库。
        ```toml
        name = "jiazhuangai-backend" # Worker 名称
        main = "src/index.ts" # 入口文件 (稍后创建)
        compatibility_date = "YYYY-MM-DD" # 使用当前日期

        [[d1_databases]]
        binding = "DB" # 在代码中访问数据库的绑定名称
        database_name = "jiazhuangai"
        database_id = "69c4b792-fca3-48f6-a280-1c9977ed1dee"
        ```
    *   **验证:** 确认 `wrangler.toml` 文件内容正确。

**5. Cloudflare R2 存储桶连接配置**
    *   **任务:** 在 `backend/wrangler.toml` 中添加 R2 绑定配置。
    *   **文件:** `backend/wrangler.toml`
    *   **内容:**
        ```toml
        [[r2_buckets]]
        binding = "BUCKET" # 在代码中访问存储桶的绑定名称
        bucket_name = "jiazhuangai-files"
        ```
    *   **验证:** 确认 `wrangler.toml` 文件内容正确。

**6. (可选) Cloudflare KV 命名空间连接配置**
    *   **任务:** 在 `backend/wrangler.toml` 中添加 KV 绑定配置。
    *   **文件:** `backend/wrangler.toml`
    *   **内容:**
        ```toml
        [[kv_namespaces]]
        binding = "KV" # 在代码中访问 KV 的绑定名称
        id = "a120d00a55da47e682ad94852b8ab4cb"
        ```
    *   **验证:** 确认 `wrangler.toml` 文件内容正确。

**7. 定义数据库表结构 (SQL)**
    *   **任务:** 创建 SQL 文件定义 `users`, `categories`, `articles` 表的结构。
    *   **文件:** `backend/schema.sql`
    *   **内容:**
        ```sql
        -- 用户表 (管理员)
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL, -- 存储哈希后的密码
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 分类表
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 文章表
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE, -- 用于 URL 访问
            content TEXT,
            category_id INTEGER,
            parent_id INTEGER, -- 用于树形结构 (AI相关纪事)
            image_urls TEXT, -- 存储 R2 图片 URL 列表 (JSON 字符串或分隔符)
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (parent_id) REFERENCES articles(id) ON DELETE SET NULL -- 自引用
        );

        -- (可选) 为 slug 创建索引以提高查询性能
        CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
        CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
        CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles (category_id);
        CREATE INDEX IF NOT EXISTS idx_articles_parent_id ON articles (parent_id);
        ```
    *   **验证:** 检查 SQL 语法和表结构定义是否符合项目概述。

**8. 创建数据库表 (D1)**
    *   **任务:** 使用 Wrangler 将 `schema.sql` 应用到 Cloudflare D1 数据库。
    *   **指令示例:** `cd backend && npx wrangler d1 execute jiazhuangai --file=./schema.sql`
    *   **验证:** 登录 Cloudflare 控制台或使用 `npx wrangler d1 execute jiazhuangai --command="PRAGMA table_list;"` 确认表已创建。

**9. 添加初始数据 (可选但推荐)**
    *   **任务:** 向 `users` 和 `categories` 表添加一些初始数据，方便后续开发测试。
    *   **方法:** 编写 SQL `INSERT` 语句或使用 Wrangler D1 命令。
    *   **指令示例 (添加管理员):** `cd backend && npx wrangler d1 execute jiazhuangai --command="INSERT INTO users (username, password) VALUES ('admin', 'hashed_password');"` (注意：密码需要预先哈希)
    *   **验证:** 使用 `SELECT * FROM users;` 和 `SELECT * FROM categories;` 查询确认数据已插入。

**10. 定义数据模型 (TypeScript)**
    *   **任务:** 在后端和前端项目中创建 TypeScript 类型/接口来定义数据模型。
    *   **文件 (示例):** `backend/src/models.ts`, `frontend/src/types/models.ts`
    *   **内容 (示例):**
        ```typescript
        // frontend/src/types/models.ts 或共享库
        export interface User {
          id: number;
          username: string;
          created_at: string;
        }

        export interface Category {
          id: number;
          name: string;
          slug: string;
          description?: string;
          created_at: string;
          updated_at: string;
        }

        export interface Article {
          id: number;
          title: string;
          slug: string;
          content?: string;
          category_id?: number;
          parent_id?: number;
          image_urls?: string; // JSON string or comma-separated
          created_at: string;
          updated_at: string;
          category?: Category; // 可能在获取时关联
          children?: Article[]; // 用于树形结构
        }
        ```
    *   **验证:** 类型定义与数据库结构一致。

---

## 阶段二：后端 API 开发 (核心功能)

**目标:** 开发核心的后台管理 API 接口，遵循 RESTful 原则。

**通用说明:**
*   使用 Hono 框架创建路由和处理请求。
*   在 `backend/src/index.ts` 中设置 Hono 应用。
*   创建 `backend/src/routes/` 目录存放不同资源的路由。
*   创建 `backend/src/services/` 目录封装业务逻辑和数据库交互。
*   实现合适的错误处理和响应格式。

**11. 后端基础设置与入口文件**
    *   **任务:** 创建后端入口文件 `backend/src/index.ts` 并设置 Hono 应用。
    *   **文件:** `backend/src/index.ts`
    *   **内容 (示例):**
        ```typescript
        import { Hono } from 'hono';
        // 导入环境变量类型 (如果使用 wrangler.toml 定义了类型)
        // type Env = { DB: D1Database, BUCKET: R2Bucket, KV: KVNamespace }

        const app = new Hono<{ Bindings: Env }>(); // 使用泛型绑定环境变量

        app.get('/', (c) => c.text('Hello from Jiazhuangai AI Backend!'));

        // TODO: 在此挂载其他路由

        export default app;
        ```
    *   **验证:** `cd backend && npx wrangler dev` 能成功启动本地开发服务器，访问 `http://localhost:8787` 显示问候语。

**12. 认证授权模块 - 登录 API**
    *   **任务:** 实现管理员登录 API。
    *   **路由:** `POST /api/auth/login`
    *   **文件:** `backend/src/routes/auth.ts`, `backend/src/services/authService.ts`
    *   **逻辑:**
        1.  接收 `username` 和 `password`。
        2.  从 `users` 表查询用户。
        3.  验证密码哈希。
        4.  (成功) 生成 JWT 或其他 Session Token。
        5.  (失败) 返回错误响应。
    *   **验证:** 使用 Postman 或 curl 发送 POST 请求到 `/api/auth/login`，使用正确的凭证应返回 Token，错误的凭证应返回 401 或类似错误。

**13. 认证授权模块 - 认证中间件**
    *   **任务:** 实现一个 Hono 中间件，用于验证请求头中的 Token。
    *   **文件:** `backend/src/middleware/authMiddleware.ts`
    *   **逻辑:**
        1.  从请求头 (e.g., `Authorization: Bearer <token>`) 获取 Token。
        2.  验证 Token 的有效性 (签名、有效期)。
        3.  (成功) 将用户信息附加到上下文 (c.set)，调用 next()。
        4.  (失败) 返回 401 或 403 错误。
    *   **验证:** 将此中间件应用于后续需要保护的路由，尝试无 Token 或无效 Token 访问，应被拒绝。

**14. 分类服务 - 获取列表 API**
    *   **任务:** 实现获取所有分类列表的 API。
    *   **路由:** `GET /api/categories`
    *   **文件:** `backend/src/routes/categories.ts`, `backend/src/services/categoryService.ts`
    *   **逻辑:** 查询 `categories` 表，返回所有分类数据。
    *   **验证:** 使用 Postman 或 curl 发送 GET 请求到 `/api/categories`，应返回包含初始分类数据的 JSON 数组。

**15. 分类服务 - 创建分类 API**
    *   **任务:** 实现创建新分类的 API (需要认证)。
    *   **路由:** `POST /api/categories` (应用认证中间件)
    *   **文件:** `backend/src/routes/categories.ts`, `backend/src/services/categoryService.ts`
    *   **逻辑:**
        1.  接收 `name`, `slug`, `description`。
        2.  验证数据 (例如 slug 唯一性)。
        3.  向 `categories` 表插入新记录。
        4.  返回新创建的分类数据或成功消息。
    *   **验证:** 使用 Postman 或 curl (带有效 Token) 发送 POST 请求，然后调用获取列表 API 确认新分类已添加。

**16. 分类服务 - 更新分类 API**
    *   **任务:** 实现更新现有分类的 API (需要认证)。
    *   **路由:** `PUT /api/categories/:id` (应用认证中间件)
    *   **文件:** `backend/src/routes/categories.ts`, `backend/src/services/categoryService.ts`
    *   **逻辑:** 根据 `:id` 更新 `categories` 表中的记录。
    *   **验证:** 使用 Postman 或 curl (带有效 Token) 发送 PUT 请求，然后调用获取列表或详情 API 确认分类已更新。

**17. 分类服务 - 删除分类 API**
    *   **任务:** 实现删除分类的 API (需要认证)。
    *   **路由:** `DELETE /api/categories/:id` (应用认证中间件)
    *   **文件:** `backend/src/routes/categories.ts`, `backend/src/services/categoryService.ts`
    *   **逻辑:** 根据 `:id` 删除 `categories` 表中的记录 (注意外键约束对 `articles` 表的影响，可能需要先处理关联文章或设置 `ON DELETE SET NULL`)。
    *   **验证:** 使用 Postman 或 curl (带有效 Token) 发送 DELETE 请求，然后调用获取列表 API 确认分类已删除。

**18. 文章服务 - 获取列表 API (分页/过滤)**
    *   **任务:** 实现获取文章列表的 API，支持分页、按分类过滤。
    *   **路由:** `GET /api/articles`
    *   **文件:** `backend/src/routes/articles.ts`, `backend/src/services/articleService.ts`
    *   **逻辑:**
        1.  接收查询参数 (e.g., `page`, `limit`, `categoryId`)。
        2.  构建 SQL 查询，包含 `WHERE` (过滤) 和 `LIMIT`/`OFFSET` (分页)。
        3.  (可选) 同时查询总数用于分页。
        4.  返回文章列表和分页信息。
    *   **验证:** 使用 Postman 或 curl 发送 GET 请求，带不同查询参数，验证返回结果是否正确。

**19. 文章服务 - 获取树形列表 API**
    *   **任务:** 实现获取用于“AI相关纪事”的树形结构文章列表 API。
    *   **路由:** `GET /api/articles/tree`
    *   **文件:** `backend/src/routes/articles.ts`, `backend/src/services/articleService.ts`
    *   **逻辑:**
        1.  查询所有 `parent_id` 不为 NULL 或特定分类的文章。
        2.  在应用层将扁平列表构造成树形结构 (递归或迭代)。
    *   **验证:** 使用 Postman 或 curl 发送 GET 请求，验证返回的数据是否为嵌套的树形 JSON 结构。

**20. 文章服务 - 获取详情 API**
    *   **任务:** 实现获取单篇文章详情的 API。
    *   **路由:** `GET /api/articles/:slug` (或 `/api/articles/:id`)
    *   **文件:** `backend/src/routes/articles.ts`, `backend/src/services/articleService.ts`
    *   **逻辑:** 根据 `slug` 或 `id` 查询 `articles` 表，返回文章详情。
    *   **验证:** 使用 Postman 或 curl 发送 GET 请求，验证返回的文章内容是否正确。

**21. 文章服务 - 创建文章 API**
    *   **任务:** 实现创建新文章的 API (需要认证)。
    *   **路由:** `POST /api/articles` (应用认证中间件)
    *   **文件:** `backend/src/routes/articles.ts`, `backend/src/services/articleService.ts`
    *   **逻辑:**
        1.  接收 `title`, `slug`, `content`, `category_id`, `parent_id`, `image_urls` 等。
        2.  验证数据 (slug 唯一性)。
        3.  向 `articles` 表插入新记录。
        4.  返回新创建的文章数据。
    *   **验证:** 使用 Postman 或 curl (带有效 Token) 发送 POST 请求，然后调用获取列表或详情 API 确认新文章已添加。

**22. 文章服务 - 更新文章 API**
    *   **任务:** 实现更新现有文章的 API (需要认证)。
    *   **路由:** `PUT /api/articles/:id` (应用认证中间件)
    *   **文件:** `backend/src/routes/articles.ts`, `backend/src/services/articleService.ts`
    *   **逻辑:** 根据 `:id` 更新 `articles` 表中的记录。
    *   **验证:** 使用 Postman 或 curl (带有效 Token) 发送 PUT 请求，然后调用详情 API 确认文章已更新。

**23. 文章服务 - 删除文章 API**
    *   **任务:** 实现删除文章的 API (需要认证)。
    *   **路由:** `DELETE /api/articles/:id` (应用认证中间件)
    *   **文件:** `backend/src/routes/articles.ts`, `backend/src/services/articleService.ts`
    *   **逻辑:** 根据 `:id` 删除 `articles` 表中的记录。
    *   **验证:** 使用 Postman 或 curl (带有效 Token) 发送 DELETE 请求，然后调用获取列表 API 确认文章已删除。

**24. 文件上传服务 (R2)**
    *   **任务:** 实现文件上传逻辑。
    *   **方案 A (后端代理):**
        *   **路由:** `POST /api/upload` (应用认证中间件)
        *   **逻辑:** 接收文件 -> 使用 R2 SDK 的 `put` 方法上传 -> 返回文件 URL。
    *   **方案 B (前端直传):**
        *   **路由:** `GET /api/upload/presigned-url` (应用认证中间件)
        *   **逻辑:** 生成 R2 的预签名 PUT URL -> 返回给前端。前端使用此 URL 直接上传。
    *   **验证:** 成功上传文件到 R2 存储桶，并能在文章中正确引用其 URL。

**(继续添加用户管理 API 的细化步骤...)**

---

## 阶段三：前端开发 (后台管理界面)

**目标:** 开发功能完善、与后端 API 对接的后台管理界面。

**通用说明:**
*   使用 Next.js App Router 或 Pages Router。
*   创建 `frontend/src/app/admin` 或 `frontend/src/pages/admin` 目录。
*   使用状态管理库 (如 Zustand, Jotai, Redux Toolkit) 或 React Context 管理全局状态 (如登录状态)。
*   使用 UI 库 (如 Shadcn/ui, MUI, Ant Design) 构建界面。
*   封装 API 请求函数 (如使用 `fetch` 或 `axios`)。

**25. 后台基础布局与路由设置**
    *   **任务:** 创建后台管理的根布局和路由结构。
    *   **文件:** `frontend/src/app/admin/layout.tsx`, `frontend/src/app/admin/page.tsx` (或 Pages Router 对应文件)
    *   **内容:** 包含侧边栏导航、顶部栏、内容区域的基本结构。
    *   **验证:** 访问 `/admin` 路径能看到基础布局。

**26. 登录页面实现**
    *   **任务:** 创建登录页面 UI 并实现登录逻辑。
    *   **文件:** `frontend/src/app/login/page.tsx` (或 `pages/login.tsx`)
    *   **逻辑:**
        1.  创建用户名、密码输入框和登录按钮。
        2.  提交时调用后端 `POST /api/auth/login` API。
        3.  成功后存储 Token (localStorage 或 httpOnly Cookie) 并跳转到后台首页 (`/admin`)。
        4.  处理错误提示。
    *   **验证:** 能成功登录并跳转，错误凭证有提示。

**27. 路由保护 (客户端)**
    *   **任务:** 实现客户端路由守卫，阻止未登录用户访问后台页面。
    *   **方法:** 在后台布局组件 (`admin/layout.tsx`) 或使用中间件 (App Router) 或高阶组件 (Pages Router) 检查登录状态，未登录则重定向到 `/login`。
    *   **验证:** 未登录状态下直接访问 `/admin/*` 路径会被重定向到登录页。

**28. 分类管理 - 列表页面**
    *   **任务:** 创建展示分类列表的页面。
    *   **文件:** `frontend/src/app/admin/categories/page.tsx`
    *   **逻辑:**
        1.  页面加载时调用 `GET /api/categories` API 获取数据。
        2.  使用表格或其他形式展示分类列表。
        3.  包含“新建”、“编辑”、“删除”按钮。
    *   **验证:** 页面能正确显示从 API 获取的分类数据。

**29. 分类管理 - 创建/编辑功能**
    *   **任务:** 实现创建和编辑分类的表单（通常使用 Modal 或单独页面）。
    *   **文件:** (可能在 `categories/page.tsx` 中或创建新组件 `CategoryForm.tsx`)
    *   **逻辑:**
        1.  表单包含 `name`, `slug`, `description` 输入。
        2.  提交时根据是创建还是编辑，调用 `POST` 或 `PUT /api/categories/:id` API。
        3.  成功后刷新列表或更新 UI。
    *   **验证:** 能成功创建和编辑分类，列表实时更新。

**30. 分类管理 - 删除功能**
    *   **任务:** 实现删除分类的确认和请求逻辑。
    *   **文件:** (在 `categories/page.tsx` 的列表项中)
    *   **逻辑:**
        1.  点击删除按钮时弹出确认框。
        2.  确认后调用 `DELETE /api/categories/:id` API。
        3.  成功后刷新列表。
    *   **验证:** 能成功删除分类，列表实时更新。

**(继续添加文章管理、用户管理前端页面的细化步骤...)**

---

## 阶段四：前端开发 (前台展示界面)

**目标:** 开发面向普通用户的、美观易用的前台展示页面。

**通用说明:**
*   创建 `frontend/src/app/(main)` 或 `frontend/src/pages/` 下的非 admin 路由。
*   注重 SEO 优化 (使用 Next.js 的 SSR/SSG 功能)。
*   实现响应式设计。

**31. 前台核心布局**
    *   **任务:** 创建前台网站的整体布局。
    *   **文件:** `frontend/src/app/(main)/layout.tsx` (或 `_app.tsx`, `_document.tsx` in Pages Router)
    *   **内容:** 包含页头 (Logo, 导航), 页脚, 主要内容区域。
    *   **验证:** 访问网站首页能看到统一的页头页脚。

**32. AI 相关纪事页面 - 树形展示**
    *   **任务:** 实现展示 AI 相关纪事的页面。
    *   **文件:** `frontend/src/app/(main)/chronicles/page.tsx` (示例路径)
    *   **逻辑:**
        1.  使用 Next.js 数据获取方法 (如 `fetch` 在 Server Component 中) 调用 `GET /api/articles/tree` API。
        2.  选择合适的树形组件库或自行实现，渲染树形结构。
        3.  实现节点的展开/折叠交互。
    *   **验证:** 页面能正确渲染从 API 获取的树形数据，交互流畅。

**33. AI 家装应用页面 - 分类与列表**
    *   **任务:** 实现展示 AI 家装应用分类和文章列表的页面。
    *   **文件:** `frontend/src/app/(main)/applications/[categorySlug]/page.tsx` (示例动态路由)
    *   **逻辑:**
        1.  获取所有分类用于导航 (`GET /api/categories`)。
        2.  根据当前 `categorySlug` 获取对应分类的文章列表 (`GET /api/articles?categorySlug=...`)。
        3.  渲染分类导航和文章列表。
    *   **验证:** 能根据 URL 中的分类 slug 显示正确的文章列表。

**34. 文章详情页面**
    *   **任务:** 实现展示单篇文章内容的页面。
    *   **文件:** `frontend/src/app/(main)/article/[articleSlug]/page.tsx` (示例动态路由)
    *   **逻辑:**
        1.  根据 `articleSlug` 调用 `GET /api/articles/:slug` API 获取文章详情。
        2.  渲染文章标题、内容、元信息 (作者、时间等)。
        3.  处理文章内容中的 Markdown 或 HTML。
    *   **验证:** 能正确显示指定 slug 的文章内容。

**35. 关于我们页面**
    *   **任务:** 创建静态或半静态的“关于我们”页面。
    *   **文件:** `frontend/src/app/(main)/about/page.tsx`
    *   **逻辑:** 展示预设的文本和图片内容，或从特定 API 获取。
    *   **验证:** 页面内容显示正确。

---

## 阶段五：集成、测试与部署

**目标:** 确保系统稳定可靠，并成功部署上线。

**36. 前后端集成测试**
    *   **任务:** 全面测试前后端所有功能的交互流程。
    *   **方法:** 模拟用户操作，覆盖所有核心场景（浏览、登录、增删改查）。
    *   **验证:** 所有功能按预期工作，数据流正确。

**37. 编写单元/集成测试 (推荐)**
    *   **任务:** 为关键的后端服务逻辑和前端组件编写测试用例。
    *   **工具:** Vitest, Jest, React Testing Library 等。
    *   **验证:** 测试用例通过，提高代码覆盖率。

**38. 性能优化**
    *   **任务:** 分析并优化前后端性能瓶颈。
    *   **方法:** 使用 Lighthouse, WebPageTest 分析前端加载速度；检查后端 API 响应时间，优化数据库查询。
    *   **验证:** 页面加载速度和 API 响应时间达到预期目标。

**39. 安全加固**
    *   **任务:** 检查并修复潜在的安全漏洞。
    *   **方法:** 代码审查，使用安全扫描工具，确保输入验证、密码哈希、权限控制到位。
    *   **验证:** 常见 Web 漏洞（XSS, CSRF, SQL注入等）得到有效防护。

**40. 部署后端到 Cloudflare Workers**
    *   **任务:** 将 `backend` 项目部署到 Cloudflare Workers。
    *   **指令:** `cd backend && npx wrangler deploy`
    *   **验证:** 部署成功，可以通过 Worker URL 访问后端 API。

**41. 部署前端到 Cloudflare Pages**
    *   **任务:** 将 `frontend` 项目连接到 Cloudflare Pages 进行部署。
    *   **方法:** 在 Cloudflare 控制台创建 Pages 项目，连接到 Git 仓库，配置构建命令 (`npm run build`) 和输出目录 (`.next` 或 `out`)。
    *   **验证:** 部署成功，可以通过 Pages URL 访问前端应用。

**42. 配置域名与最终测试**
    *   **任务:** 将自定义域名指向 Cloudflare Pages/Workers。
    *   **方法:** 配置 DNS 记录。
    *   **验证:** 通过自定义域名访问网站，并在生产环境进行最终的功能和兼容性测试。

---

**AI 交互提示:**

*   在执行每个步骤时，可以向 AI 提供当前步骤编号和任务描述。
*   提供相关的文件路径和预期的代码结构。
*   在遇到问题时，向 AI 提供错误信息和相关代码片段。
*   要求 AI 在生成代码时考虑错误处理和边界情况。
*   在步骤完成后，可以要求 AI 解释生成的代码或进行简单的验证。