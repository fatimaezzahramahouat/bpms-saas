// /home/manal/projet_final_BPMS/backend/src/lib/pdfToTextConverter.ts
// PDF to Text conversion with quality validation

import fs from 'fs/promises';
const pdfParse = require('pdf-parse');
const pdfParseFn = (pdfParse as any).default || pdfParse;

// ============================================================================
// INTERFACES
// ============================================================================

export interface TextExtractionResult {
  success: boolean;
  text: string;
  error?: string;
  charCount: number;
  qualityScore?: 'HIGH' | 'MEDIUM' | 'LOW' | 'FAILED';
  metadata?: {
    pageCount?: number;
    emptyLineRatio?: number;
  };
}

// ============================================================================
// MAIN FUNCTION: Convert PDF to Text with Quality Validation
// ============================================================================

export async function convertPDFtoText(pdfPath: string): Promise<TextExtractionResult> {
  try {
    console.log('🔄 [PDF→TXT] Starting conversion:', pdfPath);
    
    // 1. Check file exists
    const fileStats = await fs.stat(pdfPath);
    console.log('📊 [PDF→TXT] File size:', fileStats.size, 'bytes');
    
    if (fileStats.size === 0) {
      return {
        success: false,
        text: '',
        charCount: 0,
        error: 'PDF file is empty. Please upload a valid file.',
        qualityScore: 'FAILED'
      };
    }
    
    // 2. Read file
    const pdfBuffer = await fs.readFile(pdfPath);
    console.log('📊 [PDF→TXT] Buffer size:', pdfBuffer.length, 'bytes');
    
    // 3. Extract text using pdf-parse
    const pdfData = await pdfParseFn(pdfBuffer);
    const rawText = pdfData.text?.trim() || '';
    const pageCount = pdfData.numpages || 0;
    
    console.log('📝 [PDF→TXT] Extracted chars:', rawText.length);
    console.log('📝 [PDF→TXT] Page count:', pageCount);
    
    // 4. Quality validation - Check if text is too short (indicates scanned/image PDF)
    if (!rawText || rawText.length < 50) {
      console.warn('⚠️ [PDF→TXT] Warning: Extracted text is very short:', rawText.length, 'chars');
      return {
        success: false,
        text: rawText,
        charCount: rawText.length,
        error: 'PDF appears to be image-based/scanned. Please upload a text-based PDF, .txt, or .docx file.',
        qualityScore: 'FAILED',
        metadata: {
          pageCount,
          emptyLineRatio: 1
        }
      };
    }
    
    // 5. Check empty line ratio
    const lines = rawText.split('\n');
    const emptyLines = lines.filter((line: string) => /^\s*$/.test(line)).length;
    const emptyRatio = emptyLines / (lines.length || 1);
    
    console.log('📊 [PDF→TXT] Lines:', lines.length, '| Empty:', emptyLines, '| Ratio:', (emptyRatio * 100).toFixed(1) + '%');
    
    if (emptyRatio > 0.8) {
      console.warn('⚠️ [PDF→TXT] Warning: Too many empty lines:', (emptyRatio * 100).toFixed(1) + '%');
      return {
        success: false,
        text: rawText,
        charCount: rawText.length,
        error: 'PDF has non-standard formatting or is corrupted. Please try another format.',
        qualityScore: 'FAILED',
        metadata: {
          pageCount,
          emptyLineRatio: emptyRatio
        }
      };
    }
    
    // 6. Calculate quality score
    let qualityScore: TextExtractionResult['qualityScore'] = 'HIGH';
    if (rawText.length < 500) qualityScore = 'MEDIUM';
    if (rawText.length < 200) qualityScore = 'LOW';
    
    // 7. Log final result
    console.log('✅ [PDF→TXT] Conversion successful, quality:', qualityScore);
    console.log('📝 [PDF→TXT] Text preview (first 200 chars):', rawText.substring(0, 200).replace(/\n/g, ' | '));
    
    return {
      success: true,
      text: rawText,
      charCount: rawText.length,
      qualityScore,
      metadata: {
        pageCount,
        emptyLineRatio: emptyRatio
      }
    };
    
  } catch (error: any) {
    console.error('❌ [PDF→TXT] Conversion failed:', {
      message: error?.message || error,
      path: pdfPath,
      stack: error?.stack
    });
    
    // Handle specific error types
    let errorMessage = `Failed to read PDF: ${error.message}`;
    
    if (error.message?.includes('Password')) {
      errorMessage = 'PDF is password-protected. Please upload an unprotected PDF.';
    } else if (error.message?.includes('encrypted')) {
      errorMessage = 'PDF is encrypted. Please upload an unencrypted PDF.';
    } else if (error.message?.includes('corrupt')) {
      errorMessage = 'PDF file appears to be corrupted. Please try another file.';
    }
    
    return {
      success: false,
      text: '',
      charCount: 0,
      error: errorMessage,
      qualityScore: 'FAILED'
    };
  }
}

// ============================================================================
// HELPER: Check if file exists and is readable
// ============================================================================

export async function validatePDF(filePath: string): Promise<{ valid: boolean; error?: string }> {
  try {
    await fs.access(filePath);
    const stats = await fs.stat(filePath);
    
    if (!filePath.toLowerCase().endsWith('.pdf')) {
      return { valid: false, error: 'File is not a PDF' };
    }
    
    if (stats.size === 0) {
      return { valid: false, error: 'PDF file is empty' };
    }
    
    if (stats.size > 50 * 1024 * 1024) { // 50MB limit
      return { valid: false, error: 'PDF file is too large (max 50MB)' };
    }
    
    return { valid: true };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return { valid: false, error: 'File not found' };
    }
    return { valid: false, error: `Cannot access file: ${error.message}` };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  convertPDFtoText,
  validatePDF
};
