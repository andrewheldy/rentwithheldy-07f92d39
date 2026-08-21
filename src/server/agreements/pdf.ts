import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AgreementDetail, ResolvedAgreementDocument } from "../../lib/agreements/types.js";
import { cadenceLabel } from "../../lib/agreements/render.js";
import type { ServerSupabase } from "./server.js";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const pdfSafe = (value: string) =>
  value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-");

function wrapText(text: string, font: PDFFont, size: number, width: number) {
  const paragraphs = pdfSafe(text).split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width || !line) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function generateExecutedAgreementPdf(
  supabase: ServerSupabase,
  agreement: AgreementDetail,
) {
  const document = agreement.version.renderedContent as ResolvedAgreementDocument | null;
  if (!document || !agreement.version.documentHash) throw new Error("Frozen agreement content is missing.");

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${agreement.agreementNumber} - ${agreement.templateName}`);
  pdf.setAuthor("Rent With Heldy");
  pdf.setSubject("Executed agreement");
  pdf.setKeywords(["Rent With Heldy", "agreement", agreement.agreementNumber]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  let page: PDFPage;
  let y = 0;

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    page.drawLine({ start: { x: MARGIN, y: y + 8 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 8 }, thickness: 1.5, color: rgb(0.07, 0.57, 0.57) });
  };
  const ensure = (height: number) => {
    if (y - height < MARGIN + 24) newPage();
  };
  const drawWrapped = (text: string, options: { font?: PDFFont; size?: number; indent?: number; gap?: number } = {}) => {
    const font = options.font ?? regular;
    const size = options.size ?? 10;
    const indent = options.indent ?? 0;
    const lineHeight = size * 1.45;
    const lines = wrapText(text, font, size, CONTENT_WIDTH - indent);
    ensure(lines.length * lineHeight + (options.gap ?? 8));
    for (const line of lines) {
      page.drawText(line, { x: MARGIN + indent, y, size, font, color: rgb(0.08, 0.12, 0.16) });
      y -= lineHeight;
    }
    y -= options.gap ?? 8;
  };

  newPage();
  drawWrapped(document.title.toUpperCase(), { font: bold, size: 17, gap: 10 });
  drawWrapped(`Agreement ID: ${document.agreementNumber}   |   Version ${document.agreementVersion}`, { font: bold, size: 9, gap: 4 });
  drawWrapped(`Effective date: ${new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${document.effectiveDate}T00:00:00Z`))}`, { size: 9, gap: 16 });
  drawWrapped(document.preamble);
  drawWrapped(`${document.operator.legalName} d/b/a ${document.operator.tradeName}\n${document.operator.address}\n${document.operator.phone} | ${document.operator.email}`, { font: bold, size: 9 });
  for (const owner of document.counterparties ?? document.owners) {
    drawWrapped(`${owner.fullName}\n${owner.address ? `${owner.address}\n` : ""}${owner.phone} | ${owner.email}`, { size: 9 });
  }

  for (const section of document.sections) {
    ensure(42);
    drawWrapped(`${section.number}. ${section.title.toUpperCase()}`, { font: bold, size: 11, gap: 7 });
    for (const block of section.blocks) {
      if (block.type === "paragraph") drawWrapped(block.text);
      if (block.type === "subheading") drawWrapped(block.text.toUpperCase(), { font: bold, size: 10, gap: 6 });
      if (block.type === "bullet_list") {
        for (const item of block.items) drawWrapped(`• ${item}`, { indent: 10, gap: 4 });
      }
      if (block.type === "fields") {
        for (const field of block.fields) drawWrapped(`${field.label}: ${field.value}`, { size: 9, gap: 4 });
        y -= 4;
      }
      if (block.type === "vehicles") {
        block.vehicles.forEach((vehicle, index) => {
          drawWrapped(
            `Vehicle ${index + 1}: ${vehicle.year} ${vehicle.make} ${vehicle.model}\nVIN: ${vehicle.vin}   Mileage: ${vehicle.mileage.toLocaleString("en-US")}   License plate: ${vehicle.licensePlate || "Not provided"}`,
            { font: index === 0 ? bold : regular, size: 9 },
          );
        });
      }
      if (block.type === "revenue_split") {
        drawWrapped(`Rent With Heldy: ${block.operatorPercent}%\nVehicle Owners: ${block.ownerPercent}%`, { font: bold, size: 10 });
      }
      if (block.type === "payment_schedule") {
        drawWrapped(`Payment schedule: ${cadenceLabel(block.cadence)}.`, { font: bold, size: 10 });
      }
      if (block.type === "trial_period") {
        const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });
        drawWrapped(`Start date: ${formatter.format(new Date(`${block.startDate}T00:00:00Z`))}\nReview date: ${formatter.format(new Date(`${block.reviewDate}T00:00:00Z`))}`, { font: bold, size: 10 });
      }
      if (block.type === "signatures") {
        for (const signer of agreement.signers) {
          ensure(105);
          drawWrapped(`${signer.fullName} - ${signer.role}`, { font: bold, size: 10, gap: 4 });
          if (signer.signatureMethod === "drawn" && signer.signatureArtifactPath) {
            const { data, error } = await supabase.storage.from("agreements").download(signer.signatureArtifactPath);
            if (error || !data) throw new Error(`Signature image could not be loaded for ${signer.fullName}.`);
            const image = await pdf.embedPng(await data.arrayBuffer());
            const dimensions = image.scaleToFit(180, 54);
            ensure(dimensions.height + 24);
            page.drawImage(image, { x: MARGIN, y: y - dimensions.height, width: dimensions.width, height: dimensions.height });
            y -= dimensions.height + 8;
          } else if (signer.signatureMethod === "typed" && signer.typedSignature) {
            drawWrapped(`Typed electronic signature: ${signer.typedSignature}`, { font: italic, size: 13, gap: 5 });
          }
          drawWrapped(`Signed: ${signer.signedAt ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(signer.signedAt)) + " ET" : "Pending"}`, { size: 8, gap: 12 });
        }
      }
    }
  }

  ensure(150);
  drawWrapped("ELECTRONIC SIGNING RECORD", { font: bold, size: 12, gap: 8 });
  for (const signer of agreement.signers) {
    drawWrapped(`${signer.fullName} | ${signer.role} | Signed: ${signer.signedAt ? new Date(signer.signedAt).toISOString() : "Pending"} | Method: ${signer.signatureMethod ?? "-"}`, { size: 8, gap: 3 });
  }
  drawWrapped(`Agreement ID: ${agreement.agreementNumber}\nAgreement version: ${agreement.version.number}\nDocument SHA-256: ${agreement.version.documentHash}`, { font: regular, size: 8, gap: 4 });

  const pages = pdf.getPages();
  pages.forEach((pdfPage, index) => {
    const footer = `${agreement.agreementNumber}  |  Page ${index + 1} of ${pages.length}`;
    pdfPage.drawText(footer, { x: MARGIN, y: 28, size: 8, font: regular, color: rgb(0.35, 0.39, 0.42) });
  });
  return pdf.save();
}
