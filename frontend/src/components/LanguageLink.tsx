'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { LANGUAGE_COOKIE, type Locale } from '@/lib/locale';

type Props = ComponentProps<typeof Link> & { locale: Locale };

export default function LanguageLink({ locale, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      hrefLang={locale}
      prefetch={false}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        document.cookie = `${LANGUAGE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        if (typeof props.href === 'string') {
          event.preventDefault();
          window.location.assign(props.href);
        }
      }}
    />
  );
}
