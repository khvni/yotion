const escapeHtmlChar = (char: string) => {
  switch (char) {
    case '&':
      return '&amp;';
    case '<':
      return '&lt;';
    case '>':
      return '&gt;';
    case '"':
      return '&quot;';
    case "'":
      return '&#39;';
    default:
      return char;
  }
};

export function renderMarkdownToHtml(markdown: string): string {
  let html = '';
  let boldActive = false;
  let italicActive = false;

  for (let i = 0; i < markdown.length; i++) {
    const char = markdown[i];

    if (char === '\n') {
      html += '<br />';
      continue;
    }

    if (char === '*' && markdown[i + 1] === '*') {
      if (boldActive) {
        html += '</strong>';
        boldActive = false;
        i++;
        continue;
      }

      const closingIndex = markdown.indexOf('**', i + 2);
      if (closingIndex === -1) {
        html += escapeHtmlChar(char);
        continue;
      }

      html += '<strong>';
      boldActive = true;
      i++;
      continue;
    }

    if (char === '*') {
      if (italicActive) {
        html += '</em>';
        italicActive = false;
        continue;
      }

      const closingIndex = markdown.indexOf('*', i + 1);
      if (closingIndex === -1) {
        html += escapeHtmlChar(char);
        continue;
      }

      html += '<em>';
      italicActive = true;
      continue;
    }

    html += escapeHtmlChar(char);
  }

  if (boldActive) {
    html += '**';
  }

  if (italicActive) {
    html += '*';
  }

  return html;
}
