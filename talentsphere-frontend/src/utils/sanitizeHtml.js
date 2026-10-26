const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3',
  'H4', 'H5', 'H6', 'I', 'LI', 'OL', 'P', 'PRE', 'SPAN', 'STRONG', 'SUB',
  'SUP', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL',
]);

const ALLOWED_ATTRS = new Set(['href', 'title', 'rel', 'target', 'class', 'colspan', 'rowspan']);

const URL_ATTRS = new Set(['href', 'src']);

function isSafeUrl(value) {
  try {
    const url = new URL(value, 'https://placeholder.invalid');
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}

function cleanNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return;

  if (node.nodeType !== Node.ELEMENT_NODE) {
    node.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(node.tagName)) {
    // Unwrap: keep children (text survives), drop the dangerous shell
    while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node);
    node.remove();
    return;
  }

  for (const attr of Array.from(node.attributes)) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on') || !ALLOWED_ATTRS.has(name)) {
      node.removeAttribute(attr.name);
      continue;
    }
    if (URL_ATTRS.has(name) && !isSafeUrl(attr.value.trim())) {
      node.removeAttribute(attr.name);
    }
  }

  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
    if (node.getAttribute('target')) node.setAttribute('target', '_blank');
  }

  for (const child of Array.from(node.childNodes)) cleanNode(child);
}

/**
 * Sanitize untrusted HTML for display (defense-in-depth on top of
 * backend sanitization). Returns cleaned HTML string; empty/invalid input
 * passes through unchanged so callers can apply their own fallbacks.
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const child of Array.from(doc.body.childNodes)) cleanNode(child);
  return doc.body.innerHTML;
}
