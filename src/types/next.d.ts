declare module 'next' {
  export interface Metadata {
    title: string;
    description: string;
    [key: string]: any;
  }
}

declare module 'next/font/google' {
  export interface FontOptions {
    subsets?: string[];
    weight?: string | string[];
    display?: string;
    [key: string]: any;
  }

  export function Inter(options: FontOptions): {
    className: string;
    style: any;
  };
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (url: string) => Promise<void>;
  };
  
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}

declare module 'next/link' {
  import { ComponentProps, ReactElement } from 'react';
  
  interface LinkProps extends ComponentProps<'a'> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
  }
  
  export default function Link(props: LinkProps): ReactElement;
} 