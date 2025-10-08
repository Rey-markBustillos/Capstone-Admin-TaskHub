const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Extract text from various file types using AI
exports.extractTextFromFile = async (req, res) => {
  console.log('[DEBUG] File upload endpoint hit');
  console.log('[DEBUG] Request headers:', req.headers);
  console.log('[DEBUG] Request method:', req.method);
  
  try {
    console.log('[DEBUG] Checking if file exists in request...');
    if (!req.file) {
      console.error('[ERROR] No file found in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    const fileName = req.file.filename;

    console.log(`[DEBUG] Processing file: ${fileName}, type: ${fileType}, path: ${filePath}`);
    console.log(`[DEBUG] File size: ${req.file.size} bytes`);

    let extractedText = '';

    // Load Gemini API key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error('[ERROR] No GEMINI_API_KEY found in environment variables.');
      return res.status(500).json({ message: 'AI service not configured' });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

    try {
      if (fileType === 'text/plain') {
        // Handle text files directly
        extractedText = await fs.readFile(filePath, 'utf8');
      } else if (fileType.startsWith('image/')) {
        // Handle image files (JPG, PNG) using Gemini Vision
        const imageData = await fs.readFile(filePath);
        const base64Image = imageData.toString('base64');
        
        const prompt = "Extract ALL text content from this image. This could be from documents, presentations, handwritten notes, textbooks, worksheets, or any educational material. Include:\n- All headings, titles, and subtitles\n- All paragraphs and body text\n- Bullet points and numbered lists\n- Captions and labels\n- Any formulas, equations, or technical content\n- Table content if present\n- Any handwritten text\n\nOrganize the text in logical reading order and preserve the structure. If there are multiple sections or pages visible, clearly separate them.";
        
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: fileType,
              data: base64Image
            }
          }
        ]);
        
        const response = await result.response;
        extractedText = response.text();
        
        console.log(`[DEBUG] Extracted text from image: ${extractedText.substring(0, 100)}...`);
        
      } else if (fileType.includes('pdf')) {
        // For PDF files, we'll use AI to extract text
        // Note: For production, consider using specialized PDF libraries like pdf-parse
        const fileBuffer = await fs.readFile(filePath);
        const base64File = fileBuffer.toString('base64');
        
        const prompt = "This is a PDF document. Extract all the text content from it, maintaining the structure and organization. Include headings, paragraphs, lists, and any other textual content.";
        
        // Note: Gemini might not directly process PDF. In production, use pdf-parse or similar
        extractedText = "PDF processing requires specialized libraries. Please convert to text or image format.";
        
      } else if (fileType.includes('word') || fileType.includes('document')) {
        // For DOCX files, provide helpful guidance
        console.log(`[DEBUG] Word document detected: ${fileName}`);
        
        extractedText = `This is a Word document file (${req.file.originalname}).

For best results with quiz generation, please:
1. Copy and paste the text content directly into the text area below
2. Take screenshots of document pages and upload as images (JPG/PNG)
3. Export the document as PDF and try uploading that

The AI works excellently with plain text or images of document pages.`;
        
      } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
        // For PPT/PPTX files, provide helpful guidance
        console.log(`[DEBUG] PowerPoint file detected: ${fileName}`);
        
        extractedText = `This is a PowerPoint presentation file (${req.file.originalname}). 

For best results with quiz generation, please:
1. Convert your slides to images (JPG/PNG) and upload them - the AI can read text from slide images very accurately
2. Copy and paste the text content directly into the text area below
3. Export individual slides as images and upload them one by one

The AI excels at extracting text from images of slides, including titles, bullet points, and any text content.`;
        
      } else {
        throw new Error('Unsupported file type for text extraction');
      }

      // Clean up temporary file
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn(`[WARN] Failed to cleanup temp file: ${cleanupError.message}`);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ message: 'No text could be extracted from the file' });
      }

      console.log(`[DEBUG] Successfully extracted ${extractedText.length} characters from ${fileName}`);

      res.json({
        message: 'Text extracted successfully',
        text: extractedText.trim(),
        originalFileName: req.file.originalname,
        fileType: fileType
      });

    } catch (aiError) {
      console.error('[ERROR] AI processing failed:', aiError);
      
      // Cleanup file on error
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn(`[WARN] Failed to cleanup temp file after error: ${cleanupError.message}`);
      }
      
      res.status(500).json({ 
        message: 'Failed to extract text from file using AI',
        error: aiError.message 
      });
    }

  } catch (error) {
    console.error('[ERROR] File processing failed:', error);
    
    // Cleanup file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn(`[WARN] Failed to cleanup temp file: ${cleanupError.message}`);
      }
    }
    
    // Check if response was already sent to prevent ERR_HTTP_HEADERS_SENT
    if (!res.headersSent) {
      // Provide different error messages based on error type
      if (error.code === 'ECONNRESET' || error.message.includes('connection')) {
        res.status(502).json({ 
          message: 'Connection was reset during file processing. This often happens with large files. Please try uploading a smaller file or convert to image format.',
          error: 'Connection Reset'
        });
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        res.status(504).json({ 
          message: 'File processing timed out. Please try uploading a smaller file or convert to image format.',
          error: 'Processing Timeout'
        });
      } else {
        res.status(500).json({ 
          message: 'File processing failed',
          error: error.message 
        });
      }
    }
  }
};