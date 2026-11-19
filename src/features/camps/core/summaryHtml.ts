/** Printable summaries every camp can share (the user chooses where the file goes). */
export const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Printable HTML (A4) for the summary. `rows` are [label, value] pairs already localised by the screen. */
export function summaryHtml(title: string, subtitle: string, rows: [string, string][], note: string): string {
  const body = rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font-family:-apple-system,Roboto,Arial,sans-serif;color:#111;margin:32px}h1{font-size:22px;margin:0 0 4px}p{color:#555;margin:0 0 18px;font-size:13px}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #ddd;vertical-align:top}th{width:45%;color:#333;font-weight:600}
.note{margin-top:18px;font-size:12px;color:#666}</style></head><body><h1>${esc(title)}</h1><p>${esc(subtitle)}</p><table>${body}</table><p class="note">${esc(note)}</p></body></html>`;
}
