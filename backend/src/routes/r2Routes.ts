import { Hono } from 'hono';
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { adminMiddleware, authMiddleware, AuthUser } from '../middleware/authMiddleware'; // 假设认证中间件路径正确
import { v4 as uuidv4 } from 'uuid'; // 用于生成唯一文件名

// 定义环境变量/Secrets 的类型，确保从 c.env 中可以正确访问
type Bindings = {
    BUCKET: R2Bucket; // 使用R2Bucket类型
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_PUBLIC_URL_PREFIX: string; // 新增：R2 存储桶的公共访问 URL 前缀
    JWT_SECRET: string;
    DB: D1Database;
};

type Variables = {
    user?: AuthUser;
};

const r2Routes = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// 应用认证中间件，保护此路由
r2Routes.use('/presigned-url', authMiddleware);
r2Routes.use('/presigned-url', adminMiddleware);
r2Routes.use('/temp-upload', authMiddleware);
r2Routes.use('/temp-upload', adminMiddleware);

r2Routes.post('/presigned-url', async (c) => {
    try {
        const body = await c.req.json<{ filename: string; contentType: string; directoryPrefix?: string }>();
        
        const { filename, contentType, directoryPrefix } = body;

        if (!filename || filename.trim() === '' || filename.length > 180 || !contentType || contentType.trim() === '') {
            return c.json({ error: 'Bad Request', message: 'Filename and contentType are required and cannot be empty.' }, 400);
        }

        if (!/^(image\/(png|jpe?g|webp|gif)|video\/(mp4|webm)|application\/pdf)$/.test(contentType)) {
            return c.json({ error: 'Bad Request', message: 'Unsupported upload content type.' }, 400);
        }

        const {
            BUCKET,
            R2_ACCOUNT_ID,
            R2_ACCESS_KEY_ID,
            R2_SECRET_ACCESS_KEY,
            R2_PUBLIC_URL_PREFIX // 获取新的环境变量
        } = c.env;

        // 检查R2配置是否可用
        const r2ConfigAvailable = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL_PREFIX;
        
        if (!r2ConfigAvailable) {
            console.warn('R2 configuration is not available.');
            return c.json({ error: 'Service Unavailable', message: '文件上传服务暂时不可用。' }, 503);
        }

        // 清理和准备目录前缀
        let prefix = directoryPrefix || 'uploads/'; // 默认 "uploads/"
        if (prefix.includes('..') || prefix.includes('\\')) {
            return c.json({ error: 'Bad Request', message: 'Invalid upload directory.' }, 400);
        }
        if (prefix.startsWith('/')) {
            prefix = prefix.substring(1);
        }
        if (!prefix.endsWith('/')) {
            prefix += '/';
        }
        if (prefix === '/') prefix = ''; // 避免根目录上传时 Key 以 "/" 开头

        // 从文件名中提取扩展名
        const fileExtension = filename.split('.').pop() || ''; // 使用 filename
        // 生成一个唯一的文件名/路径
        const uniqueKey = `${prefix}${uuidv4()}.${fileExtension}`;

        const s3Client = new S3Client({
            region: 'auto', // R2 通常使用 'auto'
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });

        const command = new PutObjectCommand({
            Bucket: 'jiazhuangai-files', // 使用硬编码的bucket名称，因为R2绑定不提供名称
            Key: uniqueKey,
            ContentType: contentType,
            // ACL: 'public-read', // 如果希望上传后文件公开可读，可以设置。否则默认为私有。
            // ContentLength: contentLength, // 如果客户端提供了，可以加入以增强校验
        });

        // 预签名 URL 有效期（秒），例如 15 分钟
        const expiresIn = 900; 
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

        const publicUrl = `${R2_PUBLIC_URL_PREFIX.replace(/\/$/, '')}/${uniqueKey}`;

        return c.json({
            uploadUrl,
            key: uniqueKey,
            publicUrl: publicUrl // 返回完整的公共 URL
        });

    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return c.json({ error: '生成上传凭证失败，请稍后重试。' }, 500);
    }
});

// 添加一个临时的文件上传端点
r2Routes.post('/temp-upload', async (c) => {
    try {
        const formData = await c.req.formData();
        const file = formData.get('file');
        
        if (!file || typeof file === 'string') {
            return c.json({ error: 'Invalid file provided' }, 400);
        }

        // 生成唯一文件名
        const uniqueKey = `uploads/${uuidv4()}.jpg`;
        
        return c.json({ error: 'Not Implemented', message: `临时上传不可用：${uniqueKey}` }, 501);
    } catch (error) {
        console.error('Error in temp upload:', error);
        return c.json({ error: 'Upload failed' }, 500);
    }
});

export default r2Routes;
