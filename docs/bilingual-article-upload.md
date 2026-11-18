# 中英文文章发布

访客打开首页时，网站按浏览器语言偏好选择中文或英文，无法匹配时默认英文。顶部手动切换会记住选择。

使用现有的管理员认证向 `POST /api/articles` 发送 JSON。

| 字段 | 取值 |
| --- | --- |
| `language` | 中文传 `"zh-CN"`，英文传 `"en"`。省略时默认为中文。 |
| `translation_of` | 英文版对应的中文原文数字 `id`。独立英文文章可以省略。 |
| `slug` | 两个版本各用一个唯一值。推荐英文版用中文原文的 slug 加 `-en`。 |

先发布中文并记录响应中的 `id`，再单独发布英文。下面以原文 ID 为 `1203` 为例。

```json
{
  "title": "English article title",
  "slug": "article-topic-en",
  "content_type": "markdown",
  "content": "The English article body.",
  "language": "en",
  "translation_of": 1203
}
```

英文版可省略 `category_id` 和 `display_date`，后端会沿用原文。每篇原文最多关联一个英文版。重复发布收到 `409` 时，编辑已有的英文文章；语言和原文关联在创建时确定。需要检查已有的英文版时，从原文详情的 `translations` 查找英文 slug。

公开列表支持 `GET /api/articles?language=zh-CN` 和 `GET /api/articles?language=en`，默认只返回中文；`language=all` 返回所有语言。查询原有资讯或去重时也请显式带语言。中文文章链接为 `/articles/<slug>`，英文为 `/en/articles/<slug>`。
