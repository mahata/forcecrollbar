import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  STYLE_ID,
  overflowOverridesFor,
  injectScrollbarStyle,
  forceOverflow,
  scanAndForce,
  bootstrap,
} from './force-scrollbar.js';

const resetDocument = () => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');
  document.body.removeAttribute('style');
};

beforeEach(() => {
  resetDocument();
});

describe('overflowOverridesFor', () => {
  it('flags hidden values on every axis', () => {
    const result = overflowOverridesFor({
      overflow: 'hidden',
      overflowX: 'hidden',
      overflowY: 'hidden',
    });

    expect(result).toEqual(['overflow', 'overflow-x', 'overflow-y']);
  });

  it('flags clip values', () => {
    const result = overflowOverridesFor({
      overflow: 'clip',
      overflowX: 'visible',
      overflowY: 'clip',
    });

    expect(result).toEqual(['overflow', 'overflow-y']);
  });

  it('ignores visible, auto, and scroll values', () => {
    const result = overflowOverridesFor({
      overflow: 'visible',
      overflowX: 'auto',
      overflowY: 'scroll',
    });

    expect(result).toEqual([]);
  });
});

describe('injectScrollbarStyle', () => {
  it('injects a single style element with the scrollbar rule', () => {
    injectScrollbarStyle();

    const style = document.getElementById(STYLE_ID);
    expect(style).not.toBeNull();
    expect(style.tagName).toBe('STYLE');
    expect(style.textContent).toContain('::-webkit-scrollbar');
    expect(style.textContent).toContain('display: block !important');
  });

  it('is idempotent', () => {
    injectScrollbarStyle();
    injectScrollbarStyle();

    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);
  });
});

describe('forceOverflow', () => {
  it('overrides a hidden axis with auto !important', () => {
    const element = document.createElement('div');
    element.style.overflowX = 'hidden';
    document.body.appendChild(element);

    forceOverflow(element);

    expect(element.style.getPropertyValue('overflow-x')).toBe('auto');
    expect(element.style.getPropertyPriority('overflow-x')).toBe('important');
  });

  it('leaves scrollable axes untouched', () => {
    const element = document.createElement('div');
    element.style.overflowY = 'auto';
    document.body.appendChild(element);

    forceOverflow(element);

    expect(element.style.getPropertyValue('overflow-y')).toBe('auto');
    expect(element.style.getPropertyPriority('overflow-y')).toBe('');
  });

  it('ignores non-element inputs', () => {
    expect(() => forceOverflow(null)).not.toThrow();
    expect(() => forceOverflow(document.createTextNode('x'))).not.toThrow();
  });
});

describe('scanAndForce', () => {
  it('forces every hidden descendant of the root', () => {
    const parent = document.createElement('section');
    parent.style.overflow = 'hidden';
    const child = document.createElement('div');
    child.style.overflowY = 'clip';
    parent.appendChild(child);
    document.body.appendChild(parent);

    scanAndForce(document.body);

    expect(parent.style.getPropertyValue('overflow')).toBe('auto');
    expect(child.style.getPropertyValue('overflow-y')).toBe('auto');
  });
});

describe('bootstrap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('injects the style and forces existing hidden elements', () => {
    const hidden = document.createElement('div');
    hidden.style.overflow = 'hidden';
    document.body.appendChild(hidden);

    const teardown = bootstrap();

    expect(document.getElementById(STYLE_ID)).not.toBeNull();
    expect(hidden.style.getPropertyValue('overflow')).toBe('auto');

    teardown();
  });

  it('forces elements added after bootstrap via the observer', async () => {
    let rafCallback;
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      rafCallback = callback;
      return 1;
    });

    const teardown = bootstrap();

    const added = document.createElement('div');
    added.style.overflowX = 'hidden';
    document.body.appendChild(added);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(typeof rafCallback).toBe('function');
    rafCallback();

    expect(added.style.getPropertyValue('overflow-x')).toBe('auto');

    teardown();
  });
});
