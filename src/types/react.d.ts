import * as React from 'react';

declare module 'react' {
  export * from 'react/index';
  
  // Add React hooks
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  
  // Add React event types
  export type FormEvent<T = Element> = React.FormEvent<T>;
  export type DragEvent<T = Element> = React.DragEvent<T>;
  export type ReactNode = React.ReactNode;
  
  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: EventTarget & T;
  }
  
  export interface SyntheticEvent<T = Element> {
    currentTarget: EventTarget & T;
    target: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
    nativeEvent: Event;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    timeStamp: number;
    type: string;
  }
  
  // Add missing hooks
  export function useRef<T>(initialValue: T | null): React.RefObject<T>;
  export function createContext<T>(defaultValue: T): React.Context<T>;
  export function useContext<T>(context: React.Context<T>): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
}

declare namespace React {
  export type ReactNode = 
    | React.ReactElement
    | string
    | number
    | boolean
    | null
    | undefined
    | React.ReactNodeArray;
    
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
  
  export type ReactNodeArray = Array<ReactNode>;
  export type Key = string | number;
  
  export interface JSXElementConstructor<P> {
    (props: P): ReactElement<P, any> | null;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Add Chart.js types
declare interface ChartOptions<TType = 'line'> {
  responsive?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
    };
    tooltip?: {
      callbacks?: {
        label?: (context: any) => string;
      };
    };
  };
} 