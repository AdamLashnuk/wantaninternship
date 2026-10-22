import { cleanResumeText } from './resume-profile';
export async function extractPdfInBrowser(file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error('Use a resume smaller than 2 MB.');
  const data = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(data.slice(0, 5)) !== '%PDF-') throw new Error('This file is not a valid PDF.');
  const { PDFParse } = await import('pdf-parse');
  PDFParse.setWorker('/resume-pdf-worker.mjs');
  const parser = new PDFParse({ data, isEvalSupported: false, useSystemFonts: false });
  try {
    const info = await parser.getInfo();
    if (info.total > 10) throw new Error('Use a resume with 10 pages or fewer.');
    return cleanResumeText((await parser.getText({ pageJoiner: '' })).text);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/password/i.test(message)) throw new Error('This PDF is password protected. Upload an unlocked copy.');
    if (/readable|pages|characters/.test(message)) throw error;
    throw new Error('This PDF could not be parsed. Try downloading it as a new PDF or uploading a DOCX. You can also paste the text below.');
  } finally { await parser.destroy(); }
}
