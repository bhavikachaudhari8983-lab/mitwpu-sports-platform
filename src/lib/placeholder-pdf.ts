// Fictional sample documents (e.g. DigiLocker Class 10 certificate, seeded uploads).
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export async function samplePdf(title: string, lines: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawRectangle({ x: 0, y: 782, width: 595, height: 60, color: rgb(0.043, 0.122, 0.227) });
  page.drawText(title, { x: 40, y: 805, size: 18, font: bold, color: rgb(1, 1, 1) });
  let y = 740;
  for (const line of lines) {
    page.drawText(line, { x: 40, y, size: 12, font, color: rgb(0.06, 0.09, 0.16) });
    y -= 22;
  }
  page.drawText("FICTIONAL DEMO DOCUMENT", {
    x: 110,
    y: 300,
    size: 36,
    font: bold,
    color: rgb(0.86, 0.15, 0.15),
    opacity: 0.18,
    rotate: degrees(35),
  });
  return doc.save();
}
