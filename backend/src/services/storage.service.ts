import { supabase } from '../lib/supabase';

/**
 * Storage Service for managing file uploads to Supabase.
 */
export const storageService = {
  /**
   * Upload a CV to Supabase Storage.
   * @param file - Multer file object
   * @param email - Candidate email for the filename
   * @returns Public URL of the uploaded file
   */
  async uploadCV(file: Express.Multer.File, email: string): Promise<string> {
    // 1. Accept ONLY PDF files
    if (file.mimetype !== 'application/pdf') {
      throw new Error('Only PDF files are allowed.');
    }

    // 2. Generate filename: timestamp + candidateEmail + .pdf
    // Replacing @ and . in email to avoid path issues, or just use as is if preferred.
    // I'll use timestamp + email + .pdf as requested.
    const timestamp = Date.now();
    const fileName = `${timestamp}_${email.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = `cv/${fileName}`;

    // 3. Upload to "cv" bucket
    const { data, error } = await supabase.storage
      .from('cv')
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload CV: ${error.message}`);
    }

    // 4. Return public file URL
    const { data: publicUrlData } = supabase.storage
      .from('cv')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  },

  /**
   * Delete a file from Supabase Storage.
   * @param fileUrl - The full public URL of the file
   */
  async deleteFileFromStorage(fileUrl: string): Promise<void> {
    try {
      // Extract the path from the URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/cv/cv/[filename].pdf
      // We need the path relative to the bucket: cv/[filename].pdf
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/public/cv/');
      
      if (pathParts.length < 2) {
        throw new Error('Invalid Supabase storage URL');
      }

      const filePart = pathParts[1];
      if (!filePart) throw new Error('Invalid Supabase storage URL: file path not found');
      const filePath = decodeURIComponent(filePart);

      const { error } = await supabase.storage
        .from('cv')
        .remove([filePath]);

      if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (err) {
      console.error('Error deleting file from storage:', err);
      throw err;
    }
  }
};
