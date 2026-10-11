/** Return the next enabled tab index for a WAI-ARIA tabs keyboard event. */
export function tabIndexForKey(key, current, count, orientation = 'horizontal') {
  if (!count) return -1;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === (orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight')) return (current + 1 + count) % count;
  if (key === (orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft')) return (current - 1 + count) % count;
  return -1;
}

/** Enhance an existing tablist. Call the returned function to remove listeners. */
export function initTabs(root, { onChange, orientation = 'horizontal' } = {}) {
  if (!root?.querySelectorAll) throw new TypeError('initTabs requires a tablist element');
  const tabs = [...root.querySelectorAll('[role="tab"]')].filter(tab => tab.closest('[role="tablist"]') === root);
  const enabled = tabs.filter(tab => !tab.disabled && tab.getAttribute('aria-disabled') !== 'true');
  const document = root.ownerDocument;
  const activate = (tab, focus = true, notify = true) => {
    if (!enabled.includes(tab)) return;
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    }
    if (focus) tab.focus();
    if (notify) onChange?.(tab.id, tab);
  };
  const click = event => { const tab = event.target.closest?.('[role="tab"]'); if (tabs.includes(tab)) activate(tab); };
  const keydown = event => {
    const current = enabled.indexOf(event.target);
    if (current < 0) return;
    const next = tabIndexForKey(event.key, current, enabled.length, orientation);
    if (next >= 0) { event.preventDefault(); activate(enabled[next]); }
  };
  root.setAttribute('aria-orientation', orientation);
  const initial = enabled.find(tab => tab.getAttribute('aria-selected') === 'true') || enabled[0];
  if (initial) activate(initial, false, false);
  root.addEventListener('click', click);
  root.addEventListener('keydown', keydown);
  return () => { root.removeEventListener('click', click); root.removeEventListener('keydown', keydown); };
}
