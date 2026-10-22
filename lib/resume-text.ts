import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cleanResumeText } from './resume-profile.ts';
import { unzipSync, strFromU8 } from 'fflate';
export async function extractResume(name: string, data: Uint8Array): Promise<string> {
  if (data.byteLength > 2 * 1024 * 1024) throw new Error('Use a resume smaller than 2 MB.');
  const extension = name.toLowerCase().split('.').pop();
  let text = '';
  if (extension === 'txt') text = new TextDecoder().decode(data);
  else if (extension === 'docx') {
    // Read only document text; ignore images, macros, relationships, and external links.
    const files = unzipSync(data, { filter: file => {
      if (file.name !== 'word/document.xml') return false;
      if (file.originalSize > 1000000) throw new Error('This document is too large to extract.');
      return true;
    } });
    const xml = files['word/document.xml'];
    if (!xml) throw new Error('This DOCX has no readable document text.');
    text = strFromU8(xml).replace(/<\/w:p>/g, '\n').replace(/<w:tab\b[^>]*\/>/g, '\t').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  } else if (extension === 'pdf') {
    if (new TextDecoder().decode(data.slice(0, 5)) !== '%PDF-') throw new Error('This file is not a valid PDF.');
    const { PDFParse } = await import('pdf-parse');
    const entry = createRequire(import.meta.url).resolve('pdf-parse');
    PDFParse.setWorker(pathToFileURL(join(dirname(entry), 'pdf.worker.mjs')).href);
    const parser = new PDFParse({ data, isEvalSupported: false });
    try {
      const info = await parser.getInfo();
      if (info.total > 10) throw new Error('Use a resume with 10 pages or fewer.');
      text = (await parser.getText({ pageJoiner: '' })).text;
    } finally { await parser.destroy(); }
  } else throw new Error('Upload a PDF, DOCX, or TXT resume.');
  return cleanResumeText(text);
}
