const R2_PUBLIC_URL_PREFIX = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX || 'https://pub-3dc6a89ae11b4f2bb35597920365df2d.r2.dev';

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${R2_PUBLIC_URL_PREFIX.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
};
