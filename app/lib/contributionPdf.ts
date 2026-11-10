import { jsPDF } from 'jspdf';

export function createContributionPdf(title: string, content: string): File {
  const document = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const margin = 20;
  const usableWidth = pageWidth - margin * 2;
  const footerY = pageHeight - 14;
  const normalizedTitle = title.trim();
  const normalizedContent = content
    .replace(/\r\n?/g, '\n')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\u00a0/g, ' ');

  document.setFont('helvetica', 'bold');
  document.setFontSize(18);
  document.setTextColor(146, 64, 14);
  let y = margin + 6;
  const titleLines = document.splitTextToSize(normalizedTitle, usableWidth);
  document.text(titleLines, margin, y);
  y += titleLines.length * 9 + 8;

  document.setDrawColor(217, 119, 6);
  document.setLineWidth(0.7);
  document.line(margin, y - 3, pageWidth - margin, y - 3);

  document.setFont('helvetica', 'normal');
  document.setFontSize(11);
  document.setTextColor(30, 41, 59);

  const paragraphs = normalizedContent.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    const lines = document.splitTextToSize(paragraph.trim(), usableWidth);
    for (const line of lines) {
      if (y + 6 > footerY) {
        document.addPage();
        y = margin;
      }
      document.text(line, margin, y);
      y += 6;
    }
    y += 3;
  }

  const pageCount = document.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page);
    document.setFontSize(8);
    document.setTextColor(100, 116, 139);
    document.text(
      `${normalizedTitle} - page ${page}/${pageCount}`,
      margin,
      footerY,
      { maxWidth: usableWidth },
    );
  }

  return new File(
    [document.output('blob')],
    `${normalizedTitle.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'contribution'}.pdf`,
    { type: 'application/pdf' },
  );
}
