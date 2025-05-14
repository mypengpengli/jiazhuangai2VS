import { Hono } from 'hono';
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authMiddleware } from '../middleware/authMiddleware'; // 假设认证中间件路径正确
import { v4 as uuidv4 } from 'uuid'; // 用于生成唯一文件名

// 定义环境变量/Secrets 的类型，确保从 c.env 中可以正确访问
type Bindings = {
    R2_BUCKET_NAME: string;
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    JWT_SECRET: string; // authMiddleware 可能需要
    DB: D1Database; // 其他中间件或路由可能需要
};

const r2Routes = new Hono<{ Bindings: Bindings }>();

// 应用认证中间件，保护此路由
r2Routes.use('/presigned-url', authMiddleware);

r2Routes.post('/presigned-url', async (c) => {
    try {
        const body = await c.req.json<{ fileName: string; contentType: string }>();
        const { fileName, contentType } = body;

        if (!fileName || !contentType) {
            return c.json({ error: 'Missing fileName or contentType' }, 400);
        }

        const { R2_BUCKET_NAME, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = c.env;

        if (!R2_BUCKET_NAME || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
            console.error('R2 configuration missing in environment variables/secrets.');
            return c.json({ error: 'Server configuration error for file uploads' }, 500);
        }
        
        // 从文件名中提取扩展名
        const fileExtension = fileName.split('.').pop() || '';
        // 生成一个唯一的文件名/路径，例如使用 UUID 和原始扩展名
        // 你可以根据需要调整路径结构，例如按用户ID或日期分子目录
        const uniqueKey = `uploads/${uuidv4()}.${fileExtension}`;

        const s3Client = new S3Client({
            region: 'auto', // R2 通常使用 'auto'
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: uniqueKey,
            ContentType: contentType,
            // ACL: 'public-read', // 如果希望上传后文件公开可读，可以设置。否则默认为私有。
            // ContentLength: contentLength, // 如果客户端提供了，可以加入以增强校验
        });

        // 预签名 URL 有效期（秒），例如 15 分钟
        const expiresIn = 900; 
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

        return c.json({ 
            uploadUrl, 
            key: uniqueKey, // 前端上传成功后可能需要这个 key 来通知后端或构建访问 URL
            // publicUrl: `https://your-r2-public-domain.com/${uniqueKey}` // 如果配置了 R2 公开访问域名
        });

    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return c.json({ error: 'Failed to generate presigned URL', details: error instanceof Error ? error.message : String(error) }, 500);
    }
});

export default r2Routes;