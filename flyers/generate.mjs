import PDFDocument from '../web/node_modules/pdfkit/js/pdfkit.js';
import QRCode from '../web/node_modules/qrcode/lib/index.js';
import SVGtoPDF from '../web/node_modules/svg-to-pdfkit/source.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'all-in-agi-a4-varianten.pdf');
const duplexOut = path.join(dir, 'all-in-agi-a4-beidseitig.pdf');
const rgbDraft = path.join(dir, '.flyer-rgb.tmp.pdf');
const photoJpg = path.join(dir, '.flyer-photo.tmp.jpg');
const web = path.join(dir, '../web');
const mm = (v) => v * 72 / 25.4;
const W = mm(216), H = mm(303); // 3 mm bleed on each edge, trimmed to DIN A4.
const ink = '#1D1D1F', orange = '#FF4F18', surface = '#F5F5F7', paper = '#F5F1E8';
const font = path.join(web, 'static/fonts/google-sans-regular.ttf');
const bold = path.join(web, 'static/fonts/google-sans-bold.ttf');
const serif = path.join(dir, 'instrument-serif.ttf');
const logoMark = path.join(web, 'static/brand/all-in-agi-logo.png');
const photo = path.join(web, 'static/images/all-in-agi-event.webp');
const icons = path.join(web, 'node_modules/lucide-static/icons');
const base = 'https://all-in-agi.com/?utm_source=flyer&utm_medium=offline&utm_campaign=berlin_nachbarschaft_2026';
const urls = { a: `${base}&utm_content=seite_a`, b: `${base}&utm_content=seite_b`, c: `${base}&utm_content=seite_c` };

// 190×58 mm band on a 2400×1619 photo. Crop height keeps that ratio and is taken from the vertical middle.
const conversion = spawnSync('magick', [photo, '-gravity', 'Center', '-crop', '2400x734+0+0', '+repage', '-quality', '92', photoJpg], { stdio: 'inherit' });
if (conversion.status !== 0) throw new Error('Could not prepare website photo.');

const pdf = new PDFDocument({ size: [W, H], margin: 0, autoFirstPage: false, compress: true, pdfVersion: '1.4', info: {
  Title: 'ALL IN AGI — Berliner Flyer, drei Varianten',
  Author: 'ALL IN AGI',
  Subject: 'DIN A4 Flyer mit 3 mm Beschnitt',
} });
pdf.registerFont('regular', font).registerFont('bold', bold).registerFont('brand', serif);
const stream = fs.createWriteStream(rgbDraft);
pdf.pipe(stream);
stream.on('finish', () => {
  const result = spawnSync('gs', ['-q','-dBATCH','-dNOPAUSE','-sDEVICE=pdfwrite','-dCompatibilityLevel=1.4','-dPDFSETTINGS=/prepress','-sProcessColorModel=DeviceCMYK','-sColorConversionStrategy=CMYK',`-sOutputFile=${out}`,rgbDraft], { stdio: 'inherit' });
  fs.unlinkSync(rgbDraft);
  fs.unlinkSync(photoJpg);
  if (result.status !== 0) process.exit(result.status || 1);
  const duplex = spawnSync('gs', ['-q','-dBATCH','-dNOPAUSE','-sDEVICE=pdfwrite','-dFirstPage=1','-dLastPage=2',`-sOutputFile=${duplexOut}`,out], { stdio: 'inherit' });
  if (duplex.status !== 0) process.exit(duplex.status || 1);
  console.log(out, duplexOut);
});

function rect(x,y,w,h,color) { pdf.rect(mm(x),mm(y),mm(w),mm(h)).fill(color); }
function txt(s,x,y,w,size,color=ink,weight='regular',options={}) {
  pdf.font(weight).fontSize(size).fillColor(color).text(s,mm(x),mm(y),{width:mm(w),lineBreak:false,...options});
}
function brand() {
  // The visible arches occupy the middle of the square logo asset.
  pdf.image(logoMark, mm(13), mm(11), {width:mm(18)});
  txt('ALL IN AGI',34,15.7,72,20,'#333336','brand',{characterSpacing:0.8});
}
function icon(name,x,y,size=2.6) {
  const svg = fs.readFileSync(path.join(icons, `${name}.svg`), 'utf8').replaceAll('currentColor', ink);
  SVGtoPDF(pdf, svg, mm(x), mm(y), {width:mm(size),height:mm(size)});
}
function qr(url,x,y,size=36) {
  const q = QRCode.create(url,{errorCorrectionLevel:'H'}).modules;
  const n=q.size, quiet=4, cell=size/(n+quiet*2);
  // Only the dark modules are painted, so the page color shows through the quiet zone.
  for(let row=0;row<n;row++) for(let col=0;col<n;col++) {
    if(q.get(row,col)) rect(x+(col+quiet)*cell,y+(row+quiet)*cell,cell,cell,ink);
  }
}
function contact(url) {
  const qrY = 249, qrSize = 36;
  qr(url,13,qrY,qrSize);
  const rows = [
    ['globe','all-in-agi.com'],
    ['mail','go@all-in-agi.com'],
    ['phone','0152 57257750'],
  ];
  const iconSize = 2.6;
  const fontPt = 12;
  const pitch = 10;
  const capMm = fontPt * 0.72 * 25.4 / 72;
  const middleBaseline = qrY + qrSize / 2 + capMm / 2;
  rows.forEach(([name,label],index) => {
    const baseline = middleBaseline + (index - 1) * pitch;
    icon(name, 55, baseline - capMm + (capMm - iconSize) / 2, iconSize);
    txt(label, 60, baseline, 140, fontPt);
  });
}
function photoBand() {
  pdf.save();
  pdf.rect(mm(13),mm(177),mm(190),mm(58)).clip();
  pdf.image(photoJpg, mm(13), mm(177), {width:mm(190), height:mm(58)});
  pdf.restore();
}

// Side A: the training question and one concrete description of the offer.
pdf.addPage();
rect(0,0,216,303,surface);
brand();
txt('INTERNE KI-HACKATHONS',13,39,190,11,orange,'bold');
txt('Noch eine KI-',12,60,192,51,ink,'bold');
txt('Schulung?',12,80,192,51,ink,'bold');
txt('Bitte nicht.',12,100,192,51,ink,'bold');
txt('Beim Hackathon in Ihrem Büro baut Ihr Team mit KI-Agenten an einer echten Aufgabe aus dem Unternehmen.',13,135,185,18,ink,'regular');
photoBand();
rect(0,235,216,68,surface);
contact(urls.a);

// Side B: the pace of AI, followed by the practical format.
pdf.addPage();
rect(0,0,216,303,paper);
brand();
txt('DRANBLEIBEN BEI KI IST MÖGLICH',13,39,190,11,orange,'bold');
txt('Nein, es geht',12,65,192,53,ink,'bold');
txt('zu schnell',12,87,192,53,ink,'bold');
txt('Ein moderierter KI-Hackathon bei Ihnen vor Ort. Ihr Team arbeitet an eigenen Aufgaben und erarbeitet echte KI-gestützte Workflows.',13,128,185,18,ink,'regular');
photoBand();
rect(0,235,216,68,paper);
contact(urls.b);

// Side C: the practical-experiment angle.
pdf.addPage();
rect(0,0,216,303,'#FFFFFF');
brand();
txt('PRAKTISCH AUSPROBIEREN IST DER SCHLÜSSEL',13,39,190,11,orange,'bold');
txt('Sie wollen KI',12,60,192,49,ink,'bold');
txt('im Team wirklich',12,80,192,49,ink,'bold');
txt('nutzen?',12,100,192,49,ink,'bold');
txt('Ein Hackathon Tag mit KI-Agenten bei Ihnen vor Ort',13,135,185,20,ink,'regular');
photoBand();
rect(0,235,216,68,'#FFFFFF');
contact(urls.c);

pdf.end();
