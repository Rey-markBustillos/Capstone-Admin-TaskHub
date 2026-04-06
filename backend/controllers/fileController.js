const fs = require('fs').promises;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createCanvas, DOMMatrix, ImageData, Path2D } = require('@napi-rs/canvas');
const { createWorker } = require('tesseract.js');

const OCR_LANGUAGE = 'eng';
const PDF_OCR_MAX_PAGES = 20;

let pdfjsLibPromise = null;

const normalizeExtractedText = (value = '') =>
  String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const hasMeaningfulText = (value, minCharacters = 80, minWords = 12) => {
  const normalized = normalizeExtractedText(value);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const alphanumericCount = normalized.replace(/[^a-z0-9]/gi, '').length;
  return normalized.length >= minCharacters && wordCount >= minWords && alphanumericCount >= 40;
};

const cleanupTempFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (cleanupError) {
    if (cleanupError.code !== 'ENOENT') {
      console.warn(`[WARN] Failed to cleanup temp file: ${cleanupError.message}`);
    }
  }
};

const createUserFacingError = (message, statusCode = 422) =>
  Object.assign(new Error(message), { statusCode, expose: true });

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
};

const extractTextWithGemini = async ({ prompt, mimeType, data }) => {
  const model = getGeminiModel();
  if (!model) {
    const error = new Error('AI service not configured');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data,
      },
    },
  ]);

  const response = await result.response;
  const text = normalizeExtractedText(response.text());
  if (!text) {
    throw new Error('No text extracted by Gemini');
  }

  return text;
};

const ensurePdfJsGlobals = () => {
  if (!global.DOMMatrix) global.DOMMatrix = DOMMatrix;
  if (!global.ImageData) global.ImageData = ImageData;
  if (!global.Path2D) global.Path2D = Path2D;
};

const getPdfJsLib = async () => {
  if (!pdfjsLibPromise) {
    ensurePdfJsGlobals();
    pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }

  return pdfjsLibPromise;
};

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = Math.ceil(width);
    canvasAndContext.canvas.height = Math.ceil(height);
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

const loadPdfDocument = async (fileBuffer) => {
  const pdfjsLib = await getPdfJsLib();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer),
    disableWorker: true,
    useSystemFonts: true,
    isEvalSupported: false,
    stopAtErrors: false,
    verbosity: 0,
  });

  return loadingTask.promise;
};

const extractTextFromPdfDocument = async (pdfDocument) => {
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = normalizeExtractedText(
      textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
    );

    if (pageText) {
      pageTexts.push(`Page ${pageNumber}\n${pageText}`);
    }
  }

  return normalizeExtractedText(pageTexts.join('\n\n'));
};

const ocrImageBuffer = async (imageBuffer) => {
  const worker = await createWorker(OCR_LANGUAGE);

  try {
    const { data } = await worker.recognize(imageBuffer);
    return normalizeExtractedText(data.text);
  } finally {
    await worker.terminate();
  }
};

const ocrPdfDocument = async (pdfDocument, maxPages = PDF_OCR_MAX_PAGES) => {
  const pageLimit = Math.min(pdfDocument.numPages, maxPages);
  const canvasFactory = new NodeCanvasFactory();
  const worker = await createWorker(OCR_LANGUAGE);
  const pageTexts = [];

  try {
    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

      try {
        await page.render({
          canvasContext: canvasAndContext.context,
          viewport,
          canvasFactory,
        }).promise;

        const imageBuffer = canvasAndContext.canvas.toBuffer('image/png');
        const { data } = await worker.recognize(imageBuffer);
        const pageText = normalizeExtractedText(data.text);

        if (pageText) {
          pageTexts.push(`Page ${pageNumber}\n${pageText}`);
        }
      } finally {
        canvasFactory.destroy(canvasAndContext);
      }
    }
  } finally {
    await worker.terminate();
  }

  return {
    text: normalizeExtractedText(pageTexts.join('\n\n')),
    pagesProcessed: pageLimit,
    truncated: pdfDocument.numPages > pageLimit,
    totalPages: pdfDocument.numPages,
  };
};

const extractTextFromPdf = async (fileBuffer, originalFileName, fileType) => {
  const pdfDocument = await loadPdfDocument(fileBuffer);

  try {
    const parsedText = await extractTextFromPdfDocument(pdfDocument);
    if (hasMeaningfulText(parsedText, 80, 12)) {
      console.log('[DEBUG] PDF text extracted using pdfjs text parser');
      return {
        text: parsedText,
        extractionMethod: 'pdfjs-text',
      };
    }

    console.log('[DEBUG] PDF has little/no embedded text; starting OCR fallback');
    const ocrResult = await ocrPdfDocument(pdfDocument);
    if (hasMeaningfulText(ocrResult.text, 60, 10)) {
      console.log(`[DEBUG] PDF text extracted using OCR (${ocrResult.pagesProcessed}/${ocrResult.totalPages} pages)`);
      return {
        text: ocrResult.text,
        extractionMethod: ocrResult.truncated ? `pdf-ocr-first-${ocrResult.pagesProcessed}-pages` : 'pdf-ocr',
      };
    }

    console.log('[DEBUG] OCR did not recover enough text; trying Gemini fallback');
    const geminiText = await extractTextWithGemini({
      prompt: 'This is a PDF document. Extract all readable text in logical reading order. Include headings, paragraphs, bullet points, code snippets, labels, and table text when visible.',
      mimeType: fileType,
      data: fileBuffer.toString('base64'),
    });

    if (hasMeaningfulText(geminiText, 40, 8)) {
      console.log('[DEBUG] PDF text extracted using Gemini fallback');
      return {
        text: geminiText,
        extractionMethod: 'gemini-pdf-fallback',
      };
    }

    throw createUserFacingError(
      `Unable to automatically extract text from this PDF file (${originalFileName}). We tried PDF parsing and OCR but could not recover enough readable text.`
    );
  } finally {
    if (typeof pdfDocument.cleanup === 'function') {
      pdfDocument.cleanup();
    }
    if (typeof pdfDocument.destroy === 'function') {
      await pdfDocument.destroy();
    }
  }
};

// Extract text from various file types
exports.extractTextFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    const fileName = req.file.filename;
    const originalFileName = req.file.originalname;

    let extractedText = '';
    let extractionMethod = '';

    try {
      if (fileType === 'text/plain' || filePath.endsWith('.txt')) {
        extractedText = normalizeExtractedText(await fs.readFile(filePath, 'utf8'));
        extractionMethod = 'plain-text';
      } else if (fileType.startsWith('image/')) {
        const imageData = await fs.readFile(filePath);

        try {
          extractedText = await extractTextWithGemini({
            prompt: 'Extract all text from this image in logical reading order. Include headings, paragraphs, lists, labels, formulas, and handwritten text when visible.',
            mimeType: fileType,
            data: imageData.toString('base64'),
          });
          extractionMethod = 'gemini-image';
        } catch (imageAiError) {
          console.warn(`[WARN] Gemini image extraction failed: ${imageAiError.message}. Falling back to OCR.`);
          extractedText = await ocrImageBuffer(imageData);
          extractionMethod = 'ocr-image';
        }

        console.log(`[DEBUG] Extracted text from image via ${extractionMethod}: ${extractedText.substring(0, 100)}...`);
      } else if (fileType.includes('pdf')) {
        console.log(`[DEBUG] PDF file detected: ${fileName}`);
        const fileBuffer = await fs.readFile(filePath);
        const pdfResult = await extractTextFromPdf(fileBuffer, originalFileName, fileType);
        extractedText = pdfResult.text;
        extractionMethod = pdfResult.extractionMethod;
      } else if (
        fileType.includes('presentation') ||
        fileType.includes('powerpoint') ||
        filePath.toLowerCase().endsWith('.ppt') ||
        filePath.toLowerCase().endsWith('.pptx')
      ) {
        console.log(`[DEBUG] PowerPoint file detected: ${fileName} (${fileType})`);
        const fileBuffer = await fs.readFile(filePath);

        extractedText = await extractTextWithGemini({
          prompt: 'This is a Microsoft PowerPoint presentation. Extract all text content from all slides, keeping slide order and structure.',
          mimeType: fileType,
          data: fileBuffer.toString('base64'),
        });
        extractionMethod = 'gemini-powerpoint';
      } else if (
        ((fileType.includes('word') || fileType.includes('wordprocessingml')) && !fileType.includes('presentation')) ||
        filePath.toLowerCase().endsWith('.doc') ||
        filePath.toLowerCase().endsWith('.docx')
      ) {
        console.log(`[DEBUG] Word document detected: ${fileName} (${fileType})`);
        const fileBuffer = await fs.readFile(filePath);

        extractedText = await extractTextWithGemini({
          prompt: 'This is a Microsoft Word document. Extract all text content in logical reading order, including headings, paragraphs, lists, and tables.',
          mimeType: fileType,
          data: fileBuffer.toString('base64'),
        });
        extractionMethod = 'gemini-word';
      } else {
        throw new Error('Unsupported file type for text extraction');
      }

      if (!normalizeExtractedText(extractedText)) {
        throw createUserFacingError('No text could be extracted from the file.');
      }

      console.log(`[DEBUG] Successfully extracted ${extractedText.length} characters from ${fileName} using ${extractionMethod}`);

      res.json({
        message: 'Text extracted successfully',
        text: normalizeExtractedText(extractedText),
        originalFileName,
        fileType,
        extractionMethod,
      });
    } finally {
      await cleanupTempFile(filePath);
    }
  } catch (error) {
    console.error('[ERROR] File processing failed:', error);

    if (req.file && req.file.path) {
      await cleanupTempFile(req.file.path);
    }

    if (!res.headersSent) {
      const statusCode =
        error.statusCode ||
        (error.code === 'ECONNRESET' || String(error.message || '').includes('connection')
          ? 502
          : error.code === 'ETIMEDOUT' || String(error.message || '').includes('timeout')
            ? 504
            : error.code === 'AI_NOT_CONFIGURED'
              ? 500
              : 500);

      res.status(statusCode).json({
        message:
          error.expose
            ? error.message
            : statusCode === 502
              ? 'Connection was reset during file processing. Please try again with a smaller file.'
              : statusCode === 504
                ? 'File processing timed out. Please try again with a smaller file.'
                : statusCode === 500 && error.code === 'AI_NOT_CONFIGURED'
                  ? 'AI service not configured'
                  : 'File processing failed',
        error: error.message,
      });
    }
  }
};
