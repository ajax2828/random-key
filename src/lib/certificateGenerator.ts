export const FONT_FAMILIES = [
  { label: 'Sans Serif (Inter)', value: '"Inter","Segoe UI",Arial,sans-serif' },
  { label: 'Arial', value: 'Arial,Helvetica,sans-serif' },
  { label: 'Helvetica', value: 'Helvetica,Arial,sans-serif' },
  { label: 'Verdana', value: 'Verdana,Geneva,sans-serif' },
  { label: 'Tahoma', value: 'Tahoma,Geneva,sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS",Helvetica,sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman",Times,serif' },
  { label: 'Georgia', value: 'Georgia,Palatino,serif' },
  { label: 'Garamond', value: 'Garamond,"Times New Roman",serif' },
  { label: 'Palatino', value: '"Palatino Linotype","Book Antiqua",Palatino,serif' },
  { label: 'Courier New', value: '"Courier New",Courier,monospace' },
  { label: 'Consolas', value: 'Consolas,monaco,monospace' },
  { label: 'Lucida Console', value: '"Lucida Console",Monaco,monospace' },
  { label: 'Impact', value: 'Impact,Haettenschweiler,sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS",cursive,sans-serif' },
];

export interface CustomTextField {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  enabled: boolean;
}

export interface CertConfig {
  showCertNo: boolean;
  certNoX: number;
  certNoY: number;
  certNoFontSize: number;
  certNoColor: string;
  certNoFontFamily: string;
  certNoPrefix: string;
  autoNumberStart: number;
  nameX: number;
  nameY: number;
  nameFontSize: number;
  nameColor: string;
  nameFontFamily: string;
  customTexts: CustomTextField[];
}

export interface CertData {
  name: string;
  certNo: string;
}

export interface ParsedCSV {
  data: CertData[];
  errors: string[];
}

export function parseCSV(csvText: string, autoStart: number): ParsedCSV {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const errors: string[] = [];
  const data: CertData[] = [];

  if (lines.length === 0) {
    errors.push('CSV kosong');
    return { data, errors };
  }

  const cols = lines[0].split(',').map(c => c.trim().toLowerCase().replace(/["']/g, ''));
  const nameIdx = cols.findIndex(c =>
    ['name', 'nama', 'fullname', 'full_name', 'nama_lengkap', 'nama lengkap', 'nama_peserta', 'nama peserta', 'peserta', 'participant'].includes(c)
  );
  const noIdx = cols.findIndex(c =>
    ['cert_no', 'no', 'number', 'cert_number', 'nomor', 'no_sertifikat', 'no sertifikat'].includes(c)
  );

  if (nameIdx === -1) {
    errors.push('Kolom "name" tidak ditemukan di header CSV. Header: ' + cols.join(', '));
    return { data, errors };
  }

  const startLine = 1;
  let counter = autoStart;

  for (let i = startLine; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const name = (vals[nameIdx] || '').trim();
    if (!name) continue;

    let certNo: string;
    if (noIdx !== -1 && vals[noIdx]?.trim()) {
      certNo = vals[noIdx].trim();
    } else {
      certNo = String(counter++);
    }

    data.push({ name, certNo });
  }

  return { data, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

export function generateCertificate(
  templateImg: HTMLImageElement,
  data: CertData,
  config: CertConfig
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const w = templateImg.naturalWidth;
    const h = templateImg.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas not supported')); return; }

    ctx.drawImage(templateImg, 0, 0, w, h);

    const scale = Math.min(w, h) / 1000;

    const drawText = (
      text: string,
      xPct: number,
      yPct: number,
      fontSize: number,
      color: string,
      fontFamily: string
    ) => {
      const x = (xPct / 100) * w;
      const y = (yPct / 100) * h;
      const size = Math.max(8, fontSize * scale);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${size}px ${fontFamily}`;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 2;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    if (config.showCertNo) {
      const certNoText = `${config.certNoPrefix}${data.certNo}`;
      if (certNoText.trim()) {
        drawText(
          certNoText,
          config.certNoX,
          config.certNoY,
          config.certNoFontSize,
          config.certNoColor,
          config.certNoFontFamily
        );
      }
    }

    drawText(
      data.name,
      config.nameX,
      config.nameY,
      config.nameFontSize,
      config.nameColor,
      config.nameFontFamily
    );

    for (const ct of config.customTexts) {
      if (!ct.enabled || !ct.text.trim()) continue;
      drawText(ct.text, ct.x, ct.y, ct.fontSize, ct.color, ct.fontFamily);
    }

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Gagal generate sertifikat'));
    }, 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let _customIdCounter = 0;
export function generateCustomId(): string {
  return `custom_${++_customIdCounter}_${Date.now()}`;
}
