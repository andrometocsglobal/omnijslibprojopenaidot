import test from 'node:test';
import assert from 'node:assert/strict';
import { tabIndexForKey, initTabs } from '../src/dom.js';
test('tabs keyboard navigation wraps in both directions', () => {
  assert.equal(tabIndexForKey('ArrowRight', 2, 3), 0);
  assert.equal(tabIndexForKey('ArrowLeft', 0, 3), 2);
  assert.equal(tabIndexForKey('Home', 2, 3), 0);
  assert.equal(tabIndexForKey('End', 0, 3), 2);
});
test('vertical tabs only respond to vertical arrows', () => {
  assert.equal(tabIndexForKey('ArrowRight', 0, 3, 'vertical'), -1);
  assert.equal(tabIndexForKey('ArrowDown', 0, 3, 'vertical'), 1);
  assert.equal(tabIndexForKey('ArrowUp', 0, 3, 'vertical'), 2);
  assert.equal(tabIndexForKey(' ', 0, 3), -1);
  assert.equal(tabIndexForKey('Home', 0, 0), -1);
});
test('invalid root is rejected without a DOM dependency', () => {
  assert.throws(() => initTabs(null), /tablist element/);
});

function fixture() {
  const listeners = new Map();
  const panels = new Map();
  let focused = null;
  const root = {
    querySelectorAll: () => tabs,
    ownerDocument: { getElementById: id => panels.get(id) },
    setAttribute: () => {},
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); },
  };
  const tabs = ['first', 'disabled', 'last'].map((id, index) => {
    const attrs = new Map([['aria-controls', `${id}-panel`], ['aria-selected', String(index === 0)]]);
    panels.set(`${id}-panel`, { hidden: false });
    const tab = {
      id, disabled: index === 1, tabIndex: 0,
      closest: () => root,
      getAttribute: name => attrs.get(name) ?? null,
      setAttribute: (name, value) => attrs.set(name, value),
      focus: () => { focused = id; },
    };
    return tab;
  });
  return { root, tabs, panels, listeners, focus: () => focused };
}
test('vanilla tabs normalize selection, skip disabled tabs and remove listeners', () => {
  const f = fixture();
  const changes = [];
  const cleanup = initTabs(f.root, { onChange: id => changes.push(id) });
  assert.equal(f.tabs[0].tabIndex, 0);
  assert.equal(f.tabs[1].tabIndex, -1);
  assert.equal(f.panels.get('first-panel').hidden, false);
  assert.equal(f.panels.get('last-panel').hidden, true);
  assert.deepEqual(changes, []);
  let prevented = false;
  f.listeners.get('keydown')({ key: 'ArrowRight', target: f.tabs[0], preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.focus(), 'last');
  assert.equal(f.tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(f.tabs[0].getAttribute('aria-selected'), 'false');
  assert.equal(f.panels.get('last-panel').hidden, false);
  assert.deepEqual(changes, ['last']);
  cleanup();
  cleanup();
  assert.equal(f.listeners.size, 0);
});
test('clicking a disabled tab does not select it', () => {
  const f = fixture();
  initTabs(f.root);
  f.listeners.get('click')({ target: { closest: () => f.tabs[1] } });
  assert.equal(f.tabs[0].getAttribute('aria-selected'), 'true');
  f.listeners.get('click')({ target: { closest: () => f.tabs[2] } });
  assert.equal(f.tabs[2].getAttribute('aria-selected'), 'true');
});
