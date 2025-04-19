/**
 * Document Extractor Service
 * 
 * Dieser Service bietet erweiterte Funktionen zur Textextraktion aus verschiedenen Dokumenttypen,
 * einschließlich PDF, Word, Excel, HTML und Bildformaten. Dadurch wird die Analyse
 * von verschiedenen Dokumenttypen verbessert und die Extraktion von strukturierten
 * Informationen ermöglicht.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { createWorker } from 'tesseract.js';
import textract from 'textract';
import * as ExcelJS from 'exceljs';
import { parse as parseHTML } from 'node-html-parser';

const readFile = promisify(fs.readFile);
const textractFromFile = promisify(textract.fromFileWithPath);

export interface ExtractedDocumentInfo {
  text: string;
  metadata: {
    author?: string;
    creationDate?: Date;
    modifiedDate?: Date;
    title?: string;
    keywords?: string[];
    pageCount?: number;
    sections?: { title: string; content: string }[];
    tables?: any[][];
    language?: string;
  };
  structuredData?: any;
}

/**
 * Klasse zum Extrahieren von Text und Metadaten aus verschiedenen Dokumenttypen
 */
export class DocumentExtractor {
  
  /**
   * Extrahiert Text und Metadaten aus einer Datei basierend auf ihrem Typ
   */
  async extractFromFile(filePath: string): Promise<ExtractedDocumentInfo> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Datei existiert nicht: ${filePath}`);
    }

    const extension = path.extname(filePath).toLowerCase();
    console.log(`Extrahiere Dokument: ${filePath} (Typ: ${extension})`);

    try {
      switch (extension) {
        case '.pdf':
          return await this.extractFromPdf(filePath);
        case '.docx':
        case '.doc':
          return await this.extractFromWord(filePath);
        case '.xlsx':
        case '.xls':
          return await this.extractFromExcel(filePath);
        case '.html':
        case '.htm':
          return await this.extractFromHtml(filePath);
        case '.txt':
          return await this.extractFromText(filePath);
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.tiff':
        case '.tif':
        case '.bmp':
          return await this.extractFromImage(filePath);
        case '.pptx':
        case '.ppt':
          return await this.extractFromPresentation(filePath);
        case '.csv':
          return await this.extractFromCsv(filePath);
        case '.rtf':
          return await this.extractFromRichText(filePath);
        default:
          return await this.extractGeneric(filePath, extension);
      }
    } catch (error) {
      console.error(`Fehler bei der Extraktion von ${filePath}:`, error);
      return {
        text: `Extraktion fehlgeschlagen für ${path.basename(filePath)}`,
        metadata: {}
      };
    }
  }

  /**
   * Extrahiert Text und Metadaten aus einem PDF-Dokument
   */
  private async extractFromPdf(filePath: string): Promise<ExtractedDocumentInfo> {
    try {
      const dataBuffer = await readFile(filePath);
      
      // Sichere Verwendung des PDF-Parsers mit try-catch
      let pdfData: any;
      try {
        // Dynamischer Import des PDF-Parsers
        const pdfParse = (await import('pdf-parse')).default;
        pdfData = await pdfParse(dataBuffer);
      } catch (error) {
        console.error("Fehler beim Parsen des PDFs:", error);
        // Fallback bei Fehler
        return {
          text: `[PDF-Inhalt konnte nicht extrahiert werden: ${path.basename(filePath)}]`,
          metadata: {
            title: path.basename(filePath, path.extname(filePath))
          }
        };
      }
      
      const info = pdfData.info || {};
      const keywords = info.Keywords?.split(',').map((kw: string) => kw.trim()) || [];
      
      return {
        text: pdfData.text || "",
        metadata: {
          author: info.Author,
          title: info.Title || path.basename(filePath, path.extname(filePath)),
          creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
          modifiedDate: info.ModDate ? new Date(info.ModDate) : undefined,
          pageCount: pdfData.numpages,
          keywords: keywords
        }
      };
    } catch (error) {
      console.error("Fehler bei der PDF-Extraktion:", error);
      return {
        text: `[PDF konnte nicht gelesen werden: ${path.basename(filePath)}]`,
        metadata: {
          title: path.basename(filePath, path.extname(filePath))
        }
      };
    }
  }

  /**
   * Extrahiert Text und Metadaten aus einem Word-Dokument
   */
  private async extractFromWord(filePath: string): Promise<ExtractedDocumentInfo> {
    try {
      const text = await textractFromFile(filePath, { preserveLineBreaks: true });
      
      // In einem realen System würden wir hier mammoth.js verwenden, um strukturierte Daten zu extrahieren
      // und mehr Metadaten aus dem Word-Dokument zu holen
      
      return {
        text,
        metadata: {
          title: path.basename(filePath, path.extname(filePath))
        }
      };
    } catch (error) {
      console.error('Fehler bei Word-Extraktion:', error);
      throw error;
    }
  }

  /**
   * Extrahiert Text und Strukturierte Daten aus einer Excel-Datei
   */
  private async extractFromExcel(filePath: string): Promise<ExtractedDocumentInfo> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    let allText = '';
    const tables: any[][] = [];
    
    workbook.eachSheet((worksheet) => {
      const sheetData: any[] = [];
      
      worksheet.eachRow((row) => {
        const rowData: any[] = [];
        let rowText = '';
        
        row.eachCell((cell) => {
          rowData.push(cell.value);
          rowText += cell.value + '\t';
        });
        
        sheetData.push(rowData);
        allText += rowText.trim() + '\n';
      });
      
      tables.push(sheetData);
    });
    
    return {
      text: allText,
      metadata: {
        author: workbook.creator || undefined,
        title: path.basename(filePath, path.extname(filePath)),
        creationDate: workbook.created,
        modifiedDate: workbook.modified,
        tables
      },
      structuredData: tables
    };
  }

  /**
   * Extrahiert Text aus einer HTML-Datei
   */
  private async extractFromHtml(filePath: string): Promise<ExtractedDocumentInfo> {
    const htmlContent = await readFile(filePath, 'utf8');
    const root = parseHTML(htmlContent);
    
    // Extrahiere Text und entferne überschüssige Leerzeichen
    const text = root.textContent.replace(/\s+/g, ' ').trim();
    
    // Extrahiere Metadaten aus den Meta-Tags
    const metaTags = root.querySelectorAll('meta');
    const title = root.querySelector('title')?.text || '';
    
    const metadata: Record<string, string> = {};
    metaTags.forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (name && content) {
        metadata[name] = content;
      }
    });
    
    return {
      text,
      metadata: {
        title,
        author: metadata['author'],
        keywords: metadata['keywords']?.split(',').map(kw => kw.trim()),
        // Strukturiere andere relevante Metadaten
      }
    };
  }

  /**
   * Extrahiert Text aus einer Textdatei
   */
  private async extractFromText(filePath: string): Promise<ExtractedDocumentInfo> {
    const text = await readFile(filePath, 'utf8');
    
    return {
      text,
      metadata: {
        title: path.basename(filePath, path.extname(filePath))
      }
    };
  }

  /**
   * Extrahiert Text aus einem Bild mithilfe von OCR
   */
  private async extractFromImage(filePath: string): Promise<ExtractedDocumentInfo> {
    const worker = await createWorker('deu+eng');
    
    try {
      const { data } = await worker.recognize(filePath);
      
      // Extrahiere auch Strukturinformationen über Text auf dem Bild
      const wordConfidences = data.words.map(word => word.confidence);
      const averageConfidence = wordConfidences.reduce((a, b) => a + b, 0) / wordConfidences.length;
      
      const result: ExtractedDocumentInfo = {
        text: data.text,
        metadata: {
          title: path.basename(filePath, path.extname(filePath)),
          language: data.words[0]?.language
        },
        structuredData: {
          ocrConfidence: averageConfidence,
          words: data.words
        }
      };
      
      await worker.terminate();
      return result;
    } catch (error) {
      await worker.terminate();
      console.error('OCR-Fehler:', error);
      throw error;
    }
  }

  /**
   * Extrahiert Text aus einer PowerPoint-Präsentation
   */
  private async extractFromPresentation(filePath: string): Promise<ExtractedDocumentInfo> {
    try {
      const text = await textractFromFile(filePath, { preserveLineBreaks: true });
      
      return {
        text,
        metadata: {
          title: path.basename(filePath, path.extname(filePath))
        }
      };
    } catch (error) {
      console.error('Fehler bei PowerPoint-Extraktion:', error);
      throw error;
    }
  }

  /**
   * Extrahiert Text aus einer CSV-Datei
   */
  private async extractFromCsv(filePath: string): Promise<ExtractedDocumentInfo> {
    const csvContent = await readFile(filePath, 'utf8');
    const lines = csvContent.split('\n');
    
    // Ein einfaches CSV-Parsing als Text
    let text = '';
    const structuredData: string[][] = [];
    
    lines.forEach(line => {
      const columns = line.split(',').map(col => col.trim());
      structuredData.push(columns);
      text += columns.join('\t') + '\n';
    });
    
    return {
      text,
      metadata: {
        title: path.basename(filePath, path.extname(filePath))
      },
      structuredData
    };
  }

  /**
   * Extrahiert Text aus einer RTF-Datei
   */
  private async extractFromRichText(filePath: string): Promise<ExtractedDocumentInfo> {
    try {
      const text = await textractFromFile(filePath, { preserveLineBreaks: true });
      
      return {
        text,
        metadata: {
          title: path.basename(filePath, path.extname(filePath))
        }
      };
    } catch (error) {
      console.error('Fehler bei RTF-Extraktion:', error);
      throw error;
    }
  }

  /**
   * Generische Textextraktion für unbekannte Dateitypen
   */
  private async extractGeneric(filePath: string, extension: string): Promise<ExtractedDocumentInfo> {
    try {
      console.log(`Versuche generische Extraktion für ${extension}`);
      const text = await textractFromFile(filePath, { preserveLineBreaks: true });
      
      return {
        text,
        metadata: {
          title: path.basename(filePath, path.extname(filePath))
        }
      };
    } catch (error) {
      console.error(`Generische Extraktion fehlgeschlagen für ${extension}:`, error);
      return {
        text: `Konnte Inhalt nicht extrahieren: ${path.basename(filePath)}`,
        metadata: {
          title: path.basename(filePath, path.extname(filePath))
        }
      };
    }
  }
}

export const documentExtractor = new DocumentExtractor();