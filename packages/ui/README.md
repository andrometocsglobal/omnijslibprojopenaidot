# @omni/ui

Original, lightweight UI building blocks for responsive research workspaces. The CSS works independently of React. JavaScript never initializes itself or queries the DOM at import time.

## React quick start

```jsx
import { Button, Card, Field, Input, Tabs, Modal } from '@omni/ui';
import '@omni/ui/styles.css';

<Card className="om-stack">
  <Field label="Project name" hint="A short, memorable name">
    <Input placeholder="Quantum workspace" />
  </Field>
  <Button onClick={save}>Save project</Button>
</Card>
```

Requires React and React DOM 18 or later. Sources are directly importable ESM, with TypeScript declarations. No build step is required for this package. Wrap a page in `.om-app` to opt into the default typography/background; no global reset is applied.

## Components

| Component | Props beyond native attributes |
| --- | --- |
| `Button` | `variant`: primary (default), secondary, ghost, danger; `size`: sm, md (default), lg. Defaults to `type="button"`. |
| `Card` | `as`: tag/component, default `div`. |
| `Badge` | `variant`: neutral (default), primary, success, warning, danger. |
| `Input`, `Select` | Native attributes, events and forwarded refs. `Select` takes standard `option` children. |
| `Field` | `label`, optional `hint`, `error`, `id`; one input-compatible React child. Automatically connects label, description and invalid state. |
| `Tabs` | `items: {id, label, content, disabled?}[]`, `defaultValue`, or controlled `value` + `onChange(id)`, `label`, `orientation`, `className`. |
| `Accordion` | `items: {id, title, content}[]`, optional `defaultValue`, `className`. At most one item expanded. |
| `Modal` | Controlled `open`, `onClose`, required `title`, `children`, `className`. |

Item IDs must be unique within each Tabs or Accordion instance. Tabs mount all panels but hide inactive ones, preserving child state. Selection automatically follows keyboard focus. Arrow keys wrap and skip disabled tabs; Home/End select the first/last enabled tab. Vertical tablists use up/down keys. Controlled tabs require the owner to update `value` in response to `onChange`.

Modal uses native `HTMLDialogElement.showModal()` for focus containment and background inertness, with Escape, close-button and backdrop dismissal. Update `open` to `false` in `onClose`. Focus returns to the previously focused element on closing/unmounting. Set `autoFocus` on a child control for an explicit initial focus target. Requires a modern browser with native dialog support; bring a dialog polyfill if supporting older engines. Render modals as siblings, not nested dialog elements. Server rendering is supported; dialogs open after client mounting.

```jsx
<Tabs label="Project sections" items={[
  { id: 'overview', label: 'Overview', content: <p>Project overview</p> },
  { id: 'files', label: 'Files', content: <p>Project files</p> },
]} />
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="New project">
  <Field label="Name"><Input autoFocus /></Field>
</Modal>
```

## CSS toolkit

- Layout: `.om-container`, `.om-container--fluid`, `.om-grid`, `.om-stack`, `.om-cluster`, `.om-sidebar-layout`, `.om-sidebar`, `.om-main`.
- Twelve-column grid: children span all columns by default; `.om-col-1` through `.om-col-12` override. Responsive overrides `.om-sm-col-*` (576px), `.om-md-col-*` (768px), `.om-lg-col-*` (1024px).
- Surfaces: `.om-card`, `.om-card--flush`, `.om-card--interactive`.
- Controls: `.om-btn` plus `--primary`, `--secondary`, `--ghost`, `--danger`; `--sm`, `--md`, `--lg`; `.om-input`, `.om-select`, `.om-field`, `.om-label`.
- Content: `.om-badge` with the component variants; `.om-table-wrap` around `.om-table`; `.om-alert` with optional `--success` or `--danger`. Add `role="status"` or `role="alert"` yourself when dynamically announcing an alert is appropriate.
- Spacing: `.om-p-N`, `.om-px-N`, `.om-py-N`, `.om-m-N`, `.om-mt-N`, `.om-mb-N`, `.om-gap-N` for N = 0, 1, 2, 3, 4, 5, 6, 8, 10, 12. One unit is .25rem. `--om-gap` also customizes layout gaps.
- Display: `.om-hidden`, `.om-block`, `.om-flex`, `.om-md-flex`, `.om-md-block`, `.om-md-hidden`, `.om-hide-mobile`, `.om-hide-desktop`.
- Flex: `.om-items-center`, `.om-justify-between`, `.om-flex-wrap`, `.om-grow`, `.om-min-w-0`.
- Miscellaneous: `.om-w-full`, `.om-muted`, `.om-text-primary`, `.om-text-sm`, `.om-text-xs`, `.om-text-center`, `.om-rounded`, `.om-border`, `.om-sr-only`.

```html
<div class="om-grid om-gap-6">
  <article class="om-card om-col-12 om-md-col-8">Main content</article>
  <aside class="om-card om-col-12 om-md-col-4">Details</aside>
</div>
```

All colors, radii, spacing and typography use `--om-*` CSS tokens. Set `data-theme="dark"` on the document or a containing element to switch palettes. Override tokens on a scoped container for custom themes. Reduced-motion preferences disable toolkit transitions and animations. Focus-visible outlines are included. The toolkit intentionally leaves document margins and generic headings untouched.

## Vanilla tabs

```html
<div role="tablist" aria-label="Views" id="views">
  <button type="button" role="tab" id="summary-tab" aria-controls="summary" aria-selected="true">Summary</button>
  <button type="button" role="tab" id="details-tab" aria-controls="details" aria-selected="false">Details</button>
</div>
<section role="tabpanel" id="summary" aria-labelledby="summary-tab">Summary content</section>
<section role="tabpanel" id="details" aria-labelledby="details-tab" hidden>Details content</section>
```

```js
import { initTabs } from '@omni/ui/dom';
const cleanup = initTabs(document.querySelector('#views'), {
  onChange: (tabId, tabElement) => console.log(tabId),
});
// On page/component disposal:
cleanup();
```

`initTabs` takes a tablist element and optional `orientation: 'horizontal' | 'vertical'` and `onChange`. It normalizes initial selection, tabindex and panel visibility, then handles clicks/keyboard navigation. Disabled buttons or `aria-disabled="true"` tabs are skipped. Cleanup removes listeners and keeps the last selected state. Tab structure is captured at initialization; call cleanup and initialize again after adding/removing tabs. Native buttons supply Enter/Space activation. The helper is framework-independent and has no React dependency.

`tabIndexForKey(key, currentIndex, enabledCount, orientation?)` is exported for custom widgets and returns `-1` for unhandled keys or an empty collection.

## Verification

Run `npm test -w @omni/ui` from the workspace, or `npm test` here. The Node tests cover keyboard wraparound, orientation, initialization, disabled tabs, selection synchronization and cleanup. Native dialog focus behavior should additionally be verified in the target browser; unit tests alone do not emulate browser focus and inertness.
