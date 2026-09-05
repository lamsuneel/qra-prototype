import { jsPDF } from "jspdf";

/**
 * The drawing primitives the management reports are built from.
 *
 * Both reports are the same document with different contents — same navy
 * cover, same table, same footer on every page — so they share the drawing
 * rather than each keeping their own copy of it. A change to the house style
 * then lands on both, which is the point.
 *
 * Encoding: jsPDF's standard fonts are WinAnsi. Anything outside that set is
 * dropped or garbled, so text passed to these helpers must avoid the maths
 * and arrow symbols (<= not the comparator glyph, +- not plus-minus). The em
 * dash and middle dot are inside WinAnsi and render correctly.
 */

export const A4 = { width: 210, height: 297 };
export const MARGIN = 18;
export const NAVY: [number, number, number] = [31, 56, 100];

/** The same disclaimer on every page of every report: nothing measures a person. */
export const FOOTER_NOTE =
  "Cycle time measures total process time from review opened to authorisation. Individual reviewer activity is not tracked. This report is generated from NeuraTrace and is intended for internal quality review purposes.";

export interface Layout {
  doc: jsPDF;
  y: number;
}

/** dd-Mmm-yyyy · HH:MM, the format the rest of the app uses. */
export const stamp = (at: Date): string => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(at.getDate())}-${months[at.getMonth()]}-${at.getFullYear()} · ${pad(
    at.getHours(),
  )}:${pad(at.getMinutes())}`;
};

/** A whole-number share, for the "% of Total" column both reports carry. */
export const share = (value: number, total: number): string =>
  `${Math.round((value / total) * 100)}%`;

export const sectionHeading = (layout: Layout, text: string) => {
  layout.doc.setFont("helvetica", "bold");
  layout.doc.setFontSize(12);
  layout.doc.setTextColor(0, 0, 0);
  layout.doc.text(text, MARGIN, layout.y);
  layout.y += 6;
};

export const paragraph = (layout: Layout, text: string, size = 10) => {
  layout.doc.setFont("helvetica", "normal");
  layout.doc.setFontSize(size);
  layout.doc.setTextColor(0, 0, 0);

  const lines = layout.doc.splitTextToSize(text, A4.width - MARGIN * 2);
  layout.doc.text(lines, MARGIN, layout.y);
  layout.y += lines.length * (size * 0.42) + 4;
};

/**
 * A plain bordered table. Column widths are given in millimetres so a long
 * exception description cannot push the status column off the page.
 */
export const table = (
  layout: Layout,
  headings: string[],
  rows: string[][],
  widths: number[],
) => {
  const { doc } = layout;
  const rowHeight = 7;

  doc.setFillColor(240, 242, 245);
  doc.rect(MARGIN, layout.y - 5, A4.width - MARGIN * 2, rowHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  let x = MARGIN + 2;
  headings.forEach((heading, index) => {
    doc.text(heading, x, layout.y);
    x += widths[index];
  });
  layout.y += rowHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  rows.forEach((row) => {
    x = MARGIN + 2;
    row.forEach((cell, index) => {
      const lines = doc.splitTextToSize(cell, widths[index] - 3);
      doc.text(lines.slice(0, 2), x, layout.y);
      x += widths[index];
    });

    doc.setDrawColor(224, 228, 232);
    doc.line(MARGIN, layout.y + 2, A4.width - MARGIN, layout.y + 2);
    layout.y += rowHeight;
  });

  layout.y += 4;
};

/** The navy band across the top of the cover. */
export const coverHeader = (doc: jsPDF, subtitle: string) => {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, A4.width, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NeuraTrace — Quality Review Assistant", MARGIN, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(subtitle, MARGIN, 25);
};

/** Label-and-value lines: site, period, who generated it, the reference. */
export const detailRows = (layout: Layout, details: [string, string][]) => {
  const { doc } = layout;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  details.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, MARGIN, layout.y);
    doc.setFont("helvetica", "normal");
    doc.text(value, MARGIN + 36, layout.y);
    layout.y += 7;
  });
};

/**
 * Ruled signature lines at the foot of the cover.
 *
 * A report that is going to be signed on paper needs somewhere to sign; the
 * lines are drawn rather than typed so they hold their width when printed.
 */
export const signatureBlock = (layout: Layout, roles: string[]) => {
  const { doc } = layout;

  layout.y = A4.height - 78;
  sectionHeading(layout, "Signatures");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  roles.forEach((role) => {
    doc.text(role, MARGIN, layout.y);
    doc.setDrawColor(120, 120, 120);
    doc.line(MARGIN + 58, layout.y + 1, MARGIN + 110, layout.y + 1);
    doc.text("Date:", MARGIN + 116, layout.y);
    doc.line(MARGIN + 128, layout.y + 1, A4.width - MARGIN, layout.y + 1);
    layout.y += 13;
  });
};

/** The same footer and page number on every page. */
export const footer = (doc: jsPDF, page: number, totalPages: number) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);

  const lines = doc.splitTextToSize(FOOTER_NOTE, A4.width - MARGIN * 2 - 24);
  doc.text(lines, MARGIN, A4.height - 16);

  doc.setFontSize(8);
  doc.text(`Page ${page} of ${totalPages}`, A4.width - MARGIN, A4.height - 10, {
    align: "right",
  });
};
