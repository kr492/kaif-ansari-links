/**
 * Kaif Ansari — link page behaviour.
 *
 * Features:
 *   1. Share button — opens a floating share panel (top-right) with a
 *      copy-link row, a native-share-sheet button, and a grid of
 *      provider shortcuts (LinkedIn, WhatsApp, Telegram, X, Facebook,
 *      Mail, GitHub, Drive). Copying falls back from the Clipboard API
 *      to a legacy execCommand approach so it still works over file://
 *      or in older browsers.
 *   2. In-page preview modal — links marked data-preview="iframe"
 *      (currently just the Resume) open in a small modal window
 *      instead of navigating away.
 *   3. Click analytics ping — a best-effort, non-blocking POST to
 *      /api/click. If the optional Node backend isn't running, this
 *      fails silently and the link still works normally.
 */

(function () {
  'use strict';

  // ---- Small utilities -------------------------------------------------
  const toast = document.getElementById('toast');

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () {
      toast.classList.remove('visible');
    }, 2500);
  }

  function legacyCopy(text) {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(input);
    return ok;
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (err) {
        // fall through to the legacy approach
      }
    }
    return legacyCopy(value);
  }

  function currentUrl() {
    return window.location.href;
  }

  // ---- Floating share panel ---------------------------------------------
  const shareBtn = document.getElementById('shareBtn');
  const sharePopover = document.getElementById('sharePopover');
  const shareClose = document.getElementById('shareClose');
  const shareUrl = document.getElementById('shareUrl');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const nativeShareBtn = document.getElementById('nativeShareBtn');

  const providerConfig = {
    linkedin: {
      label: 'LinkedIn',
      mode: 'share',
      build: function (url) { return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url); }
    },
    whatsapp: {
      label: 'WhatsApp',
      mode: 'share',
      build: function (url) { return 'https://wa.me/?text=' + encodeURIComponent('Mohammad Kaif Raza Ansari — ' + url); }
    },
    telegram: {
      label: 'Telegram',
      mode: 'share',
      build: function (url) { return 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('Mohammad Kaif Raza Ansari — Links'); }
    },
    x: {
      label: 'X',
      mode: 'share',
      build: function (url) { return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Mohammad Kaif Raza Ansari — Links') + '&url=' + encodeURIComponent(url); }
    },
    facebook: {
      label: 'Facebook',
      mode: 'share',
      build: function (url) { return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url); }
    },
    email: {
      label: 'Mail',
      mode: 'share',
      build: function (url) { return 'mailto:?subject=' + encodeURIComponent('Mohammad Kaif Raza Ansari — Links') + '&body=' + encodeURIComponent('Here is Kaif\'s links page:\n\n' + url); }
    }
  };

  function setShareUrl() {
    if (shareUrl) shareUrl.textContent = currentUrl();
  }

  function openSharePanel() {
    if (!sharePopover || !shareBtn) return;
    setShareUrl();
    sharePopover.hidden = false;
    shareBtn.setAttribute('aria-expanded', 'true');
    window.setTimeout(function () {
      if (copyLinkBtn) copyLinkBtn.focus();
    }, 30);
  }

  function closeSharePanel() {
    if (!sharePopover || !shareBtn || sharePopover.hidden) return;
    sharePopover.hidden = true;
    shareBtn.setAttribute('aria-expanded', 'false');
    shareBtn.focus();
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      if (sharePopover && !sharePopover.hidden) {
        closeSharePanel();
      } else {
        openSharePanel();
      }
    });
  }

  if (shareClose) shareClose.addEventListener('click', closeSharePanel);

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async function () {
      const ok = await copyText(currentUrl());
      showToast(ok ? 'Link copied' : currentUrl());
      if (ok) {
        const label = copyLinkBtn.querySelector('span');
        if (label) label.textContent = 'Copied';
        window.setTimeout(function () {
          const text = copyLinkBtn.querySelector('span');
          if (text) text.textContent = 'Copy';
        }, 1500);
      }
    });
  }

  if (nativeShareBtn) {
    nativeShareBtn.addEventListener('click', async function () {
      const shareData = {
        title: document.title,
        text: 'Mohammad Kaif Raza Ansari — Data Engineer',
        url: currentUrl()
      };
      if (!navigator.share) {
        const ok = await copyText(currentUrl());
        showToast(ok ? 'Native share unavailable — link copied' : 'Native share unavailable');
        return;
      }
      try {
        await navigator.share(shareData);
        showToast('Share sheet opened');
      } catch (err) {
        if (!err || err.name !== 'AbortError') showToast('Share was cancelled');
      }
    });
  }

  document.querySelectorAll('.share-option').forEach(function (button) {
    button.addEventListener('click', function () {
      const key = button.getAttribute('data-share-provider');
      const provider = providerConfig[key];
      if (!provider) return;
      const target = provider.build(currentUrl());
      pingClick('share_' + key);
      window.open(target, '_blank', 'noopener,noreferrer');
      showToast(provider.label + ' opened');
    });
  });

  // Close the share panel when clicking anywhere outside it.
  document.addEventListener('click', function (e) {
    if (sharePopover && !sharePopover.hidden && !sharePopover.contains(e.target) && shareBtn && !shareBtn.contains(e.target)) {
      closeSharePanel();
    }
  });

  // ---- In-page preview modal -----------------------------------------
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalFrame = document.getElementById('modalFrame');
  const modalTitle = document.getElementById('modalTitle');
  const modalOpenNew = document.getElementById('modalOpenNew');
  const modalClose = document.getElementById('modalClose');
  let lastFocused = null;

  function openPreview(url, title) {
    if (!modalBackdrop || !modalFrame) return;
    modalFrame.src = url;
    modalTitle.textContent = title || 'Preview';
    modalOpenNew.href = url;
    modalBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    modalClose.focus();
  }

  function closePreview() {
    if (!modalBackdrop || !modalFrame) return;
    modalBackdrop.hidden = true;
    modalFrame.src = '';
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  document.querySelectorAll('[data-preview="iframe"]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openPreview(el.getAttribute('href'), el.getAttribute('data-preview-title'));
      pingClick(el.getAttribute('data-link'));
    });
  });

  if (modalClose) modalClose.addEventListener('click', closePreview);

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function (e) {
      if (e.target === modalBackdrop) closePreview();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modalBackdrop && !modalBackdrop.hidden) {
      closePreview();
      return;
    }
    if (sharePopover && !sharePopover.hidden) closeSharePanel();
  });

  // ---- Optional click analytics -------------------------------------
  function pingClick(linkId) {
    if (!linkId) return;
    try {
      fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: linkId, ts: Date.now() }),
        keepalive: true
      }).catch(function () {
        /* backend not running — ignore */
      });
    } catch (err) {
      /* fetch unavailable or blocked — ignore */
    }
  }

  document.querySelectorAll('[data-link]').forEach(function (el) {
    // Skip iframe-preview links here — they already ping on their own
    // click handler above (which also needs to preventDefault first).
    if (el.getAttribute('data-preview') === 'iframe') return;
    el.addEventListener('click', function () {
      pingClick(el.getAttribute('data-link'));
    });
  });
})();
