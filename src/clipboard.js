export async function copyTextToClipboard(text) {
  if (text == null) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(String(text));
      return true;
    }
  } catch {
    // fall through
  }

  try {
    if (typeof document === 'undefined') return false;

    const el = document.createElement('textarea');
    el.value = String(text);
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '0';

    document.body.appendChild(el);
    el.focus();
    el.select();

    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
