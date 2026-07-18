(() => {
  const STYLE_ID = 'force-scrollbar-style';

  const injectScrollbarStyle = () => {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      *::-webkit-scrollbar {
        display: block !important;
        width: initial !important;
        height: initial !important;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  };

  const forceOverflow = (element) => {
    if (!(element instanceof Element)) {
      return;
    }

    const computed = getComputedStyle(element);

    if (computed.overflow === 'hidden' || computed.overflow === 'clip') {
      element.style.setProperty('overflow', 'auto', 'important');
    }

    if (computed.overflowX === 'hidden' || computed.overflowX === 'clip') {
      element.style.setProperty('overflow-x', 'auto', 'important');
    }

    if (computed.overflowY === 'hidden' || computed.overflowY === 'clip') {
      element.style.setProperty('overflow-y', 'auto', 'important');
    }
  };

  const scanAndForce = (root) => {
    if (!(root instanceof Element || root instanceof Document)) {
      return;
    }

    const rootDocument = root instanceof Document ? root : root.ownerDocument;
    if (!rootDocument) {
      return;
    }
    const walker = rootDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
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
      if (node.isConnected) {
        scanAndForce(node);
      }
    }
    pending.clear();
  };

  const queueScan = (node) => {
    const descendantsToRemove = [];
    for (const pendingNode of pending) {
      if (pendingNode.contains(node)) {
        return;
      }
      if (node.contains(pendingNode)) {
        descendantsToRemove.push(pendingNode);
      }
    }
    for (const pendingNode of descendantsToRemove) {
      pending.delete(pendingNode);
    }
    pending.add(node);
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flushPending);
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        forceOverflow(mutation.target);
      }

      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          queueScan(node);
        }
      }
    }
  });

  const startObserver = () => {
    if (!document.documentElement) {
      return;
    }
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  };

  if (document.documentElement) {
    startObserver();
  } else {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  }
})();
