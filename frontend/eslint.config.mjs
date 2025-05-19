import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 新增配置对象以覆盖或调整规则
  {
    files: ["**/*.ts", "**/*.tsx"], // 确保此规则仅应用于 TypeScript 文件
    // plugins: { // 通常 next/typescript 已经加载了 @typescript-eslint 插件
    //   '@typescript-eslint': compat.plugins('@typescript-eslint/eslint-plugin')[0].plugins['@typescript-eslint']
    // },
    rules: {
      // 调整 @typescript-eslint/no-unused-vars 规则
      // 如果 next/typescript 已经设置了此规则，这将覆盖它
      // 如果没有，这将添加它
      '@typescript-eslint/no-unused-vars': [
        'error', // 或者 'warn'，根据您的偏好
        {
          args: 'after-used', // 保留默认行为或根据需要调整
          vars: 'all',       // 保留默认行为或根据需要调整
          argsIgnorePattern: '^_', // 忽略以下划线开头的参数
          varsIgnorePattern: '^_', // 忽略以下划线开头的变量
          caughtErrorsIgnorePattern: '^_', // 忽略以下划线开头的捕获错误
          ignoreRestSiblings: true, // 通常是默认值
        },
      ],
    },
  }
];

export default eslintConfig;
