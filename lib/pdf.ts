import fs from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type DecInput = {
  policyNumber: string;
  accountName: string;
  mailingAddress: string;
  effectiveDate: Date;
  expirationDate: Date;
  umbrellaLimit: number;
  underlyingLiabilityLimit: number;
  totalPremium: string;
  properties: Array<{ address: string; occupancyType: string; units: number }>;
};

export async function generateDecPdf(input: DecInput) {
  const dir = path.join(process.cwd(), 'storage', 'policies');
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${input.policyNumber}.pdf`);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 48;

  const draw = (text: string, opts?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> }) => {
    const size = opts?.size ?? 10;
    page.drawText(text, {
      x: 48,
      y,
      size,
      font: opts?.bold ? bold : font,
      color: opts?.color ?? rgb(0, 0, 0)
    });
    y -= size + 6;
  };

  page.drawText('Texas Real Estate Umbrella Insurance', {
    x: 48,
    y,
    size: 18,
    font: bold,
    color: rgb(0.1, 0.1, 0.1)
  });
  y -= 26;

  draw('Declarations Page', { size: 13, bold: true });
  y -= 4;

  draw(`Policy Number: ${input.policyNumber}`, { bold: true });
  draw(`State of Risk: TX`);
  draw(`Issued: ${dayjs().format('YYYY-MM-DD HH:mm')}`);
  y -= 6;

  draw(`Named Insured: ${input.accountName}`, { bold: true });
  draw(`Mailing Address: ${input.mailingAddress}`);
  y -= 6;

  draw(`Effective Date: ${dayjs(input.effectiveDate).format('YYYY-MM-DD')}`);
  draw(`Expiration Date: ${dayjs(input.expirationDate).format('YYYY-MM-DD')}`);
  draw(`Umbrella Limit: $${Number(input.umbrellaLimit).toLocaleString()}`);
  draw(`Underlying Liability Limit: $${Number(input.underlyingLiabilityLimit).toLocaleString()}`);
  draw(`Total Premium (incl. taxes/fees): $${input.totalPremium}`);
  y -= 10;

  draw('Scheduled Properties', { bold: true, size: 11 });
  y -= 2;

  input.properties.forEach((p, i) => {
    draw(`${i + 1}. ${p.address}`);
    draw(`   Occupancy: ${p.occupancyType} | Units: ${p.units}`);
    y -= 2;
  });

  y = Math.max(y, 70);
  page.drawText('MVP document for demonstration only. Not a legal insurance contract form.', {
    x: 48,
    y: 48,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45)
  });

  const bytes = await pdfDoc.save();
  await fs.writeFile(filePath, bytes);

  return filePath;
}
