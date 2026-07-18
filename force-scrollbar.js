(() => {
  const STYLE_ID = 'force-scrollbar-style';
  const FORCED_ATTR = 'data-force-scrollbar-overflow';

  const injectScrollbarStyle = () => {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      *::-webkit-scrollbar {
        display: block !important;
        width: 12px !important;
        height: 12px !important;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  };

  const forceOverflow = (element) => {
    if (!(element instanceof Element)) {
      return;
    }

    const computed = getComputedStyle(element);
    let changed = false;

    if (computed.overflow === 'hidden' || computed.overflow === 'clip') {
      element.style.setProperty('overflow', 'auto', 'important');
      changed = true;
    }

    if (computed.overflowX === 'hidden' || computed.overflowX === 'clip') {
      element.style.setProperty('overflow-x', 'auto', 'important');
      changed = true;
    }

    if (computed.overflowY === 'hidden' || computed.overflowY === 'clip') {
      element.style.setProperty('overflow-y', 'auto', 'important');
      changed = true;
    }

    if (changed) {
      element.setAttribute(FORCED_ATTR, 'true');
    }
  };

  const scanAndForce = (root) => {
    if (!(root instanceof Element || root instanceof Document)) {
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let current = walker.currentNode;
    while (current) {
      forceOverflow(current);
      current = walker.nextNode();
    }
  };

  injectScrollbarStyle();
  forceOverflow(document.documentElement);
  if (document.body) {
    forceOverflow(document.body);
  }

  const run = () => scanAndForce(document);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  let scheduled = false;
  const pending = new Set();

  const flushPending = () => {
    scheduled = false;
    for (const node of pending) {
      scanAndForce(node);
    }
    pending.clear();
  };

  const queueScan = (node) => {
    pending.add(node);
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flushPending);
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        queueScan(mutation.target);
      }

      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          queueScan(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
})();
