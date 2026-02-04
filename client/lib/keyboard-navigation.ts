/**
 * Keyboard Navigation - Accessibility and keyboard shortcuts
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: string;
}

// Game keyboard shortcuts
export const GAME_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Space', description: 'Roll dice', action: 'rollDice' },
  { key: 'Enter', description: 'Confirm action', action: 'confirm' },
  { key: 'Escape', description: 'Open menu / Cancel', action: 'menu' },
  { key: 'r', description: 'Open rules', action: 'openRules' },
  { key: 'c', description: 'Open chat', action: 'openChat' },
  { key: 's', description: 'Open settings', action: 'openSettings' },
  { key: 'h', description: 'Show action history', action: 'showHistory' },
  { key: 'm', description: 'Toggle mute', action: 'toggleMute' },
  { key: 'f', description: 'Toggle fullscreen', action: 'toggleFullscreen' },
  { key: '?', shift: true, description: 'Show shortcuts', action: 'showShortcuts' },
  { key: 'Tab', description: 'Next focusable element', action: 'focusNext' },
  { key: 'Tab', shift: true, description: 'Previous focusable element', action: 'focusPrev' },
  { key: 'ArrowUp', description: 'Navigate up', action: 'navUp' },
  { key: 'ArrowDown', description: 'Navigate down', action: 'navDown' },
  { key: 'ArrowLeft', description: 'Navigate left', action: 'navLeft' },
  { key: 'ArrowRight', description: 'Navigate right', action: 'navRight' },
];

// Chat shortcuts
export const CHAT_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Enter', description: 'Send message', action: 'sendMessage' },
  { key: 'Escape', description: 'Close chat', action: 'closeChat' },
  { key: ':', description: 'Open emoji picker', action: 'openEmoji' },
];

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatches = event.key === shortcut.key ||
                     event.code === shortcut.key ||
                     event.key.toLowerCase() === shortcut.key.toLowerCase();

  const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
  const shiftMatches = !!shortcut.shift === event.shiftKey;
  const altMatches = !!shortcut.alt === event.altKey;

  return keyMatches && ctrlMatches && shiftMatches && altMatches;
}

/**
 * Find matching shortcut for a keyboard event
 */
export function findMatchingShortcut(
  event: KeyboardEvent,
  shortcuts: KeyboardShortcut[]
): KeyboardShortcut | undefined {
  return shortcuts.find(shortcut => matchesShortcut(event, shortcut));
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Cmd');

  // Format key name
  let keyDisplay = shortcut.key;
  switch (shortcut.key) {
    case 'Space': keyDisplay = 'Space'; break;
    case 'Enter': keyDisplay = 'Enter'; break;
    case 'Escape': keyDisplay = 'Esc'; break;
    case 'ArrowUp': keyDisplay = '↑'; break;
    case 'ArrowDown': keyDisplay = '↓'; break;
    case 'ArrowLeft': keyDisplay = '←'; break;
    case 'ArrowRight': keyDisplay = '→'; break;
    case 'Tab': keyDisplay = 'Tab'; break;
    default:
      if (shortcut.key.length === 1) {
        keyDisplay = shortcut.key.toUpperCase();
      }
  }

  parts.push(keyDisplay);
  return parts.join('+');
}

/**
 * Focus trap for modals
 */
export class FocusTrap {
  private container: HTMLElement;
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previouslyFocused: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  activate(): void {
    this.previouslyFocused = document.activeElement as HTMLElement;
    this.updateFocusableElements();
    this.firstFocusable?.focus();

    document.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.previouslyFocused?.focus();
  }

  private updateFocusableElements(): void {
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const elements = this.container.querySelectorAll<HTMLElement>(focusableSelector);
    this.firstFocusable = elements[0] || null;
    this.lastFocusable = elements[elements.length - 1] || null;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    this.updateFocusableElements();

    if (!this.firstFocusable || !this.lastFocusable) return;

    if (event.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable.focus();
      }
    }
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return;

  const announcer = document.getElementById('sr-announcer') || createAnnouncer();
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div');
  announcer.id = 'sr-announcer';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announcer);
  return announcer;
}

/**
 * Generate unique ID for accessibility
 */
let idCounter = 0;
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}
