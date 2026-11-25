import * as React from 'react';

declare global {
  interface HTMLElementTagNameMap {
    'sakuga-button': HTMLElement & {
      done(): void;
      impact(): void;
      primary: boolean;
      disabled: boolean;
    };
    'sakuga-tabs': HTMLElement & {
      selected: number;
      value: string;
      go(i: number, quiet?: boolean): void;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      'sakuga-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'primary' | 'secondary';
        type?: 'button' | 'submit' | 'reset';
        disabled?: boolean;
        ref?: any;
      };
      'sakuga-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
        selected?: number | string;
        ref?: any;
      };
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'sakuga-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'primary' | 'secondary';
        type?: 'button' | 'submit' | 'reset';
        disabled?: boolean;
        ref?: any;
      };
      'sakuga-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
        selected?: number | string;
        ref?: any;
      };
    }
  }
}
