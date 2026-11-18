import type { Locale } from './locale';

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const englishDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

const toShanghaiDate = (value: string | Date | null | undefined) => {
  const date = new Date(value || Date.now());
  return new Date(date.getTime() + SHANGHAI_OFFSET_MS);
};

const pad = (value: number) => String(value).padStart(2, '0');

export const formatArticleDate = (value: string | Date | null | undefined, locale: Locale = 'zh-CN') => {
  const date = toShanghaiDate(value);
  if (locale === 'en' && Number.isFinite(date.getTime())) return englishDate.format(date);
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
};

export const formatArticleTime = (value: string | Date | null | undefined) => {
  const date = toShanghaiDate(value);
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};

export const formatArticleDateTime = (value: string | Date | null | undefined, locale: Locale = 'zh-CN') => {
  return `${formatArticleDate(value, locale)} ${formatArticleTime(value)}`;
};

export const formatShortDate = (value: string | Date | null | undefined) => {
  const date = toShanghaiDate(value);
  return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
};

export const formatNumber = (value: number | null | undefined) => String(value ?? 0);
