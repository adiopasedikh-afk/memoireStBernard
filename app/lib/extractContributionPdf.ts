type ProgressCallback = (message: string) => void;

const MAX_PDF_PAGES = 30;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_PAGE_DIMENSION = 2400;
const MIN_PAGE_TEXT_LENGTH = 20;

function getPageText(items: unknown[]): string {
  return items
    .map((item) => {
      if (typeof item !== 'object' || item === null || !('str' in item) || typeof item.str !== 'string') {
        return '';
      }
      return `${item.str}${'hasEOL' in item && item.hasEOL ? '\n' : ' '}`;
    })
    .join('')
    .trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    typeof error === 'object'
    && error !== null
    && 'message' in error
    && typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'Le traitement du PDF a échoué pour une raison inconnue.';
}

export async function extractContributionPdfText(
  file: File,
  onProgress: ProgressCallback,
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Le PDF dépasse la limite de téléversement de 8 Mo.');
  }

  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/ocr/pdf.worker.min.mjs`;

  const pdf = await pdfjs.getDocument({
    data: await file.arrayBuffer(),
    useWorkerFetch: false,
  }).promise;

  let ocrWorker: Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | undefined;
  try {
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new Error(`Le PDF contient ${pdf.numPages} pages. La limite pour l’extraction est de ${MAX_PDF_PAGES} pages.`);
    }

    const pageTexts: string[] = [];
    const pagesNeedingOcr: number[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress(`Lecture du texte du PDF (${pageNumber}/${pdf.numPages})...`);
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = getPageText(textContent.items);
      pageTexts.push(text);

      if (text.replace(/\s/g, '').length < MIN_PAGE_TEXT_LENGTH) {
        pagesNeedingOcr.push(pageNumber);
      }
    }

    if (pagesNeedingOcr.length > 0) {
      const { createWorker, OEM } = await import('tesseract.js');
      let activePage = pagesNeedingOcr[0];
      ocrWorker = await createWorker('fra', OEM.LSTM_ONLY, {
        workerPath: `${window.location.origin}/ocr/tesseract-worker.min.js`,
        langPath: `${window.location.origin}/ocr/lang/4.0.0_best_int`,
        corePath: `${window.location.origin}/ocr/tesseract-core`,
        gzip: true,
        workerBlobURL: false,
        logger: ({ progress, status }) => {
          const percent = Math.round(progress * 100);
          onProgress(`Reconnaissance OCR de la page ${activePage}/${pdf.numPages} — ${status} (${percent} %)`);
        },
      });

      for (const pageNumber of pagesNeedingOcr) {
        activePage = pageNumber;
        onProgress(`Préparation de la page ${pageNumber}/${pdf.numPages} pour l’OCR...`);
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          1.5,
          MAX_PAGE_DIMENSION / Math.max(baseViewport.width, baseViewport.height),
        );
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        try {
          await page.render({ canvas, viewport }).promise;
          const { data } = await ocrWorker.recognize(canvas);
          pageTexts[pageNumber - 1] = data.text.trim();
        } finally {
          canvas.width = 0;
          canvas.height = 0;
        }
      }
    }

    const extractedText = pageTexts.filter(Boolean).join('\n\n').trim();
    if (!extractedText) {
      throw new Error('Aucun texte n’a pu être extrait de ce PDF. Vérifiez le document ou ajoutez sa transcription dans le champ texte.');
    }

    return extractedText;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  } finally {
    if (ocrWorker) await ocrWorker.terminate();
    await pdf.destroy();
  }
}
