export function tabIndexForKey(key: string, current: number, count: number, orientation?: 'horizontal' | 'vertical'): number;
export function initTabs(root: HTMLElement, options?: { orientation?: 'horizontal' | 'vertical'; onChange?: (id: string, tab: HTMLElement) => void }): () => void;
