export interface TableColumn {
  header: string;
  field: string;
}

export interface TableData {
  headers: TableColumn[];
  rows: Record<string, string>[];
}

export interface DocumentSection {
  id: string;
  title: string;
  subtitle: string;
  includeTable: boolean;
  table: TableData | null;
  description: string;
  fontSize: number;
  fontFamily: string;
  pageNumber: number;
  images: ImageBlock[];
}

export interface LetterheadTemplate {
  id: string;
  label: string;
  align: 'left' | 'center';
  divider: 'single' | 'double';
}

export const LETTERHEAD_TEMPLATES: LetterheadTemplate[] = [
  { id: 'classic', label: 'Klasik (kiri)', align: 'left', divider: 'single' },
  { id: 'center', label: 'Tengah', align: 'center', divider: 'single' },
  { id: 'formal', label: 'Formal (garis ganda)', align: 'center', divider: 'double' },
];

export type PaperSize = 'a4' | 'a3' | 'letter' | 'legal' | 'tabloid';
export type Orientation = 'portrait' | 'landscape';

export interface ImageBlock {
  id: string;
  src: string;
  alt: string;
  width: number;
  align: 'left' | 'center' | 'right';
  caption: string;
}

export interface DocumentConfig {
  letterhead: string;
  logo?: string;
  logoTemplate?: string;
  paperSize: PaperSize;
  orientation: Orientation;
  margin: number;
  images: ImageBlock[];
  sections: DocumentSection[];
}

export function generateDocumentHTML(config: DocumentConfig): string {
  const escapeHTML = (s: string): string =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  // Paper size to CSS dimensions (in mm)
  const paperSizeMap: Record<PaperSize, { w: number; h: number }> = {
    a4: { w: 210, h: 297 },
    a3: { w: 297, h: 420 },
    letter: { w: 216, h: 279 },
    legal: { w: 216, h: 356 },
    tabloid: { w: 279, h: 432 },
  };
  const ps = paperSizeMap[config.paperSize] || paperSizeMap.a4;
  const w = config.orientation === 'landscape' ? ps.h : ps.w;
  const h = config.orientation === 'landscape' ? ps.w : ps.h;
  const marginMM = config.margin || 20;

  const imageHTML = (img: ImageBlock): string => {
    const alignClass = {
      left: 'doc-img-left',
      center: 'doc-img-center',
      right: 'doc-img-right',
    }[img.align];
    const widthStyle = img.width > 0 ? `width: ${img.width}px;` : 'max-width: 100%;';
    const capHTML = img.caption
      ? `<div class="doc-img-caption ${alignClass}">${escapeHTML(img.caption)}</div>`
      : '';
    return `<div class="doc-image-block ${alignClass}" style="${widthStyle}">
      <img src="${escapeHTML(img.src)}" alt="${escapeHTML(img.alt)}" style="${widthStyle}" />
      ${capHTML}
    </div>`;
  };

  const imagesHTML = config.images && config.images.length > 0
    ? `<div class="doc-images">${config.images.map(imageHTML).join('')}</div>`
    : '';

  const sectionHTML = (section: DocumentSection): string => {
    let html = '';

    // Judul & Subjudul
    html += `<h2 class="doc-title">${escapeHTML(section.title)}</h2>`;
    html += `<h3 class="doc-subtitle">${escapeHTML(section.subtitle)}</h3>`;

    // Tabel (opsional)
    if (section.includeTable && section.table && section.table.rows.length > 0) {
      const table = section.table;
      html += `<table class="doc-table">`;
      html += `<thead><tr>`;
      table.headers.forEach((h) => {
        html += `<th>${escapeHTML(h.header)}</th>`;
      });
      html += `</tr></thead>`;
      html += `<tbody>`;
      table.rows.forEach((row) => {
        html += `<tr>`;
        table.headers.forEach((col) => {
          html += `<td>${escapeHTML(row[col.field] || '')}</td>`;
        });
        html += `</tr>`;
      });
      html += `</tbody></table>`;
    }

    // Gambar dalam section (opsional)
    if (section.images && section.images.length > 0) {
      const alignClass = {
        left: 'doc-img-left',
        center: 'doc-img-center',
        right: 'doc-img-right',
      };
      section.images.forEach((img) => {
        const widthStyle = img.width > 0 ? `width: ${img.width}px;` : 'max-width: 100%;';
        const capHTML = img.caption
          ? `<div class="doc-img-caption ${alignClass[img.align] || alignClass.center}">${escapeHTML(img.caption)}</div>`
          : '';
        html += `<div class="doc-image-block ${alignClass[img.align] || alignClass.center}" style="${widthStyle}">
          <img src="${escapeHTML(img.src)}" alt="${escapeHTML(img.alt)}" style="${widthStyle}" />
          ${capHTML}
        </div>`;
      });
    }

    // Deskripsi
    const lines = section.description
      .split('\n')
      .map((l) => (l.trim() ? `<p>${escapeHTML(l)}</p>` : ''));
    html += `<div class="doc-description" style="font-size: ${section.fontSize}px; font-family: ${section.fontFamily};">${lines.join('\n')}</div>`;

    // Page break
    html += `<div class="doc-page-break"></div>`;
    return html;
  };

  const sections = config.sections.map(sectionHTML).join('');

  const lhTemplate =
    LETTERHEAD_TEMPLATES.find((t) => t.id === config.logoTemplate) || LETTERHEAD_TEMPLATES[0];
  const logoHTML = config.logo
    ? `<img class="doc-logo doc-logo-${lhTemplate.align}" src="${config.logo}" alt="Logo">`
    : '';
  const letterheadText = config.letterhead
    ? `<div class="doc-lh-text">${escapeHTML(config.letterhead)}</div>`
    : '';
  const letterheadHTML = `<div class="doc-letterhead lh-${lhTemplate.align} divider-${lhTemplate.divider}">${logoHTML}${letterheadText}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(config.letterhead || 'Dokumen')}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&display=swap');
    @page {
      size: ${w}mm ${h}mm;
      margin: ${marginMM}mm;
    }
    body {
      font-family: "Times New Roman", Times, serif;
      margin: 0;
      padding: 0;
    }
    .doc-container {
      width: ${w}mm;
      min-height: ${h}mm;
      margin: 0 auto;
      padding: ${marginMM}mm;
      box-sizing: border-box;
      position: relative;
    }
    .doc-letterhead {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 32px;
      padding-bottom: 16px;
    }
    .doc-letterhead.lh-left {
      text-align: left;
      border-bottom: 1px solid #ccc;
    }
    .doc-letterhead.lh-center {
      text-align: center;
      border-bottom: 1px solid #ccc;
    }
    .doc-letterhead.divider-double {
      border-bottom: 3px double #999;
    }
    .doc-logo {
      display: block;
      max-width: 150px;
      max-height: 100px;
      object-fit: contain;
    }
    .doc-logo-left {
      float: left;
      margin: 0 16px 10px 0;
    }
    .doc-logo-center {
      margin: 0 auto 10px;
    }
    .doc-lh-text {
      white-space: pre-line;
    }
    .doc-title {
      font-size: 24px;
      font-weight: bold;
      margin: 24px 0 8px;
      font-family: "Times New Roman", Times, serif;
    }
    .doc-subtitle {
      font-size: 18px;
      font-weight: normal;
      margin: 0 0 16px;
      font-family: "Times New Roman", Times, serif;
    }
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-family: "Times New Roman", Times, serif;
    }
    .doc-table th,
    .doc-table td {
      border: 1px solid #777;
      padding: 6px 10px;
      text-align: left;
      font-size: 12px;
    }
    .doc-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .doc-description {
      line-height: 1.8;
      margin: 16px 0;
      font-family: "Times New Roman", Times, serif;
      font-weight: normal;
    }
    .doc-description p {
      margin: 0 0 8px;
      text-indent: 2em;
    }
    .doc-page-break {
      page-break-before: always;
      break-before: page;
      height: 0;
      visibility: hidden;
      margin: 0;
      padding: 0;
    }
    .doc-images {
      margin: 16px 0;
      clear: both;
    }
    .doc-image-block {
      margin: 12px 0;
    }
    .doc-img-left {
      float: left;
      clear: left;
      margin: 0 16px 8px 0;
      text-align: left;
    }
    .doc-img-right {
      float: right;
      clear: right;
      margin: 0 0 8px 16px;
      text-align: right;
    }
    .doc-img-center {
      display: block;
      margin: 12px auto;
      text-align: center;
    }
    .doc-image-block img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    .doc-img-caption {
      font-size: 11px;
      font-style: italic;
      color: #555;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="doc-container">
    ${letterheadHTML}
    ${imagesHTML}
    ${sections}
  </div>
</body>
</html>`;
}

export function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadDOC(html: string, filename: string) {
  const docName = /\.docx?$/i.test(filename) ? filename : `${filename}.doc`;
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = docName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let _tableIdCounter = 0;
export function generateTableId(): string {
  return `doc_table_${++_tableIdCounter}_${Date.now()}`;
}

export function generateSectionId(): string {
  return `doc_section_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateImageId(): string {
  return `doc_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultTable(): TableData {
  return {
    headers: [
      { header: 'Kolom 1', field: 'col1' },
      { header: 'Kolom 2', field: 'col2' },
    ],
    rows: [
      { col1: '', col2: '' },
    ],
  };
}
