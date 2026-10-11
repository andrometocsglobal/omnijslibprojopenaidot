import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { tabIndexForKey } from './dom.js';
const h = React.createElement;
const cx = (...names) => names.filter(Boolean).join(' ');

export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }, ref) {
  return h('button', { ...props, ref, type, className: cx('om-btn', `om-btn--${variant}`, `om-btn--${size}`, className) });
});
export const Card = forwardRef(function Card({ as = 'div', className, ...props }, ref) {
  return h(as, { ...props, ref, className: cx('om-card', className) });
});
export const Badge = forwardRef(function Badge({ variant = 'neutral', className, ...props }, ref) {
  return h('span', { ...props, ref, className: cx('om-badge', `om-badge--${variant}`, className) });
});
export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return h('input', { ...props, ref, className: cx('om-input', className) });
});
export const Select = forwardRef(function Select({ className, ...props }, ref) {
  return h('select', { ...props, ref, className: cx('om-select', className) });
});
export function Field({ label, hint, error, id, children, className, ...props }) {
  const generated = useId();
  const controlId = id || generated;
  const descriptionId = `${controlId}-description`;
  const description = error || hint;
  const child = React.isValidElement(children) ? React.cloneElement(children, {
    id: controlId,
    'aria-describedby': cx(children.props['aria-describedby'], description ? descriptionId : undefined) || undefined,
    'aria-invalid': error ? true : children.props['aria-invalid'],
  }) : children;
  return h('div', { ...props, className: cx('om-field', className) },
    h('label', { htmlFor: controlId, className: 'om-label' }, label), child,
    description && h('span', { id: descriptionId, className: cx('om-field__hint', error && 'om-field__error') }, description));
}
export function Tabs({ items, defaultValue, value, onChange, label = 'Tabs', orientation = 'horizontal', className }) {
  const id = useId();
  const [internal, setInternal] = useState(defaultValue ?? items.find(item => !item.disabled)?.id);
  const enabled = items.filter(item => !item.disabled);
  const selected = value ?? internal;
  const active = enabled.some(item => item.id === selected) ? selected : enabled[0]?.id;
  const refs = useRef(new Map());
  const choose = (item, focus = false) => {
    if (item.disabled) return;
    if (value === undefined) setInternal(item.id);
    onChange?.(item.id);
    if (focus) refs.current.get(item.id)?.focus();
  };
  return h('div', { className: cx('om-tabs', className) },
    h('div', { role: 'tablist', 'aria-label': label, 'aria-orientation': orientation, className: 'om-tabs__list' },
      items.map((item, index) => h('button', {
        key: item.id, type: 'button', role: 'tab', id: `${id}-tab-${index}`, disabled: item.disabled,
        ref: element => { if (element) refs.current.set(item.id, element); else refs.current.delete(item.id); },
        'aria-controls': `${id}-panel-${index}`, 'aria-selected': active === item.id,
        tabIndex: active === item.id ? 0 : -1, className: 'om-tabs__tab',
        onClick: () => choose(item),
        onKeyDown: event => {
          const next = tabIndexForKey(event.key, enabled.findIndex(entry => entry.id === item.id), enabled.length, orientation);
          if (next >= 0) { event.preventDefault(); choose(enabled[next], true); }
        },
      }, item.label))),
    items.map((item, index) => h('div', {
      key: item.id, role: 'tabpanel', id: `${id}-panel-${index}`, 'aria-labelledby': `${id}-tab-${index}`,
      hidden: active !== item.id, tabIndex: 0, className: 'om-tabs__panel',
    }, item.content)));
}
export function Accordion({ items, defaultValue, className }) {
  const id = useId();
  const [open, setOpen] = useState(defaultValue ?? null);
  return h('div', { className: cx('om-accordion', className) }, items.map((item, index) => {
    const expanded = open === item.id;
    return h('section', { key: item.id, className: 'om-accordion__item' },
      h('h3', { className: 'om-accordion__heading' }, h('button', {
        type: 'button', id: `${id}-trigger-${index}`, 'aria-expanded': expanded,
        'aria-controls': `${id}-content-${index}`, className: 'om-accordion__trigger',
        onClick: () => setOpen(expanded ? null : item.id),
      }, item.title, h('span', { 'aria-hidden': true }, expanded ? '−' : '+'))),
      h('div', { id: `${id}-content-${index}`, role: 'region', 'aria-labelledby': `${id}-trigger-${index}`, hidden: !expanded, className: 'om-accordion__content' }, item.content));
  }));
}
/** Native modal dialog supplies focus containment and background inertness. */
export function Modal({ open, onClose, title, children, className }) {
  const id = useId();
  const dialog = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const previous = element.ownerDocument.activeElement;
    if (!element.open) element.showModal();
    const cancel = event => { event.preventDefault(); closeRef.current?.(); };
    element.addEventListener('cancel', cancel);
    return () => {
      element.removeEventListener('cancel', cancel);
      if (element.open) element.close();
      if (previous?.isConnected && typeof previous.focus === 'function') previous.focus();
    };
  }, [open]);
  return h('dialog', { ref: dialog, 'aria-labelledby': `${id}-title`, className: cx('om-modal', className),
    onClick: event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current?.(); } },
  }, h('div', { className: 'om-modal__header' }, h('h2', { id: `${id}-title` }, title),
    h(Button, { variant: 'ghost', size: 'sm', 'aria-label': 'Close dialog', onClick: () => closeRef.current?.() }, '×')),
  h('div', { className: 'om-modal__body' }, children));
}
