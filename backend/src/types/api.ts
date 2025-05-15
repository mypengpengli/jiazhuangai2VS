import { ArticleWithCategoryAndAttachments } from '../models'; // 更新导入

// 定义通用的分页响应结构
export interface PaginatedResponse<T> {
    items: T[];
    total_pages: number;
    current_page: number;
    total_items?: number; // 可选的总项目数
}

// 文章列表的分页响应类型
export type PaginatedArticlesResponse = PaginatedResponse<ArticleWithCategoryAndAttachments>; // 更新泛型参数

// 可以根据需要添加其他 API 响应类型
// export interface ErrorResponse {
//     error: string;
//     message?: string;
// }