import type * as React from 'react';
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg' };
export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export const Card: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLElement> & { as?: React.ElementType } & React.RefAttributes<HTMLElement>>;
export const Badge: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & { variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' } & React.RefAttributes<HTMLSpanElement>>;
export const Input: React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>;
export const Select: React.ForwardRefExoticComponent<React.SelectHTMLAttributes<HTMLSelectElement> & React.RefAttributes<HTMLSelectElement>>;
export function Field(props: React.HTMLAttributes<HTMLDivElement> & { label: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode; id?: string; children: React.ReactElement }): React.ReactElement;
export interface TabItem { id: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean }
export function Tabs(props: { items: TabItem[]; defaultValue?: string; value?: string; onChange?: (value: string) => void; label?: string; orientation?: 'horizontal' | 'vertical'; className?: string }): React.ReactElement;
export interface AccordionItem { id: string; title: React.ReactNode; content: React.ReactNode }
export function Accordion(props: { items: AccordionItem[]; defaultValue?: string; className?: string }): React.ReactElement;
export function Modal(props: { open: boolean; onClose: () => void; title: React.ReactNode; children?: React.ReactNode; className?: string }): React.ReactElement;
