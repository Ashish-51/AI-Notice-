import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Tesseract from 'tesseract.js';

// Initialize PDF.js worker using Vite asset import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction failed:', error);
    return '';
  }
}

export async function extractTextFromImage(file: File): Promise<string> {
  try {
    const imageUrl = URL.createObjectURL(file);
    const result = await Tesseract.recognize(imageUrl, 'eng', {
      logger: m => console.log(m)
    });
    URL.revokeObjectURL(imageUrl);
    return result.data.text.trim();
  } catch (error) {
    console.error('Image extraction failed:', error);
    return '';
  }
}
