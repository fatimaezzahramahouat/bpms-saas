import { supabase } from '../lib/supabase';
import fs from 'fs/promises';
import path from 'path';

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
   * Upload an Organisation Logo to Supabase Storage.
   * @param file - Multer file object
   * @param organisationId - Organisation ID for the filename
   * @returns Public URL of the uploaded logo
   */
  async uploadLogo(file: Express.Multer.File, organisationId: string): Promise<string> {
    console.log(`Starting logo upload for organisation: ${organisationId}`);
    // 1. Validate image mimetype (backup check)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error("Only image files (png, jpg, jpeg, webp) are allowed.");
    }

    // 2. Generate filename: organisationId + timestamp + extension
    const extension = file.originalname.split('.').pop() || 'png';
    const fileName = `logo_${organisationId}_${Date.now()}.${extension}`;
    // Simplified path: directly in the "logos" bucket
    const filePath = fileName;

    console.log(`Uploading to bucket 'logos' at path: ${filePath}`);

    // 3. Upload to "logos" bucket
    const { data, error } = await supabase.storage
      .from('logos')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload logo: ${error.message}`);
    }

    // 4. Return public file URL
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    console.log(`Logo upload finished. Public URL: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  },

  /**
   * Delete a file from storage (Supabase or local filesystem).
   * @param fileUrl - The full public URL of the file OR a relative path
   */
  async deleteFileFromStorage(fileUrl: string): Promise<void> {
    // Handle empty or invalid input
    if (!fileUrl) {
      console.warn('⚠️ [Storage] No file URL provided, skipping delete');
      return;
    }
    
    // Check if it's a local file path (starts with /uploads/)
    if (fileUrl.startsWith('/uploads/') || fileUrl.includes('uploads\\')) {
      await this.deleteLocalFile(fileUrl);
      return;
    }
    
    // Check if it's a relative path (doesn't start with http)
    if (!fileUrl.startsWith('http')) {
      await this.deleteLocalFile(fileUrl);
      return;
    }
    
    // It's a Supabase URL - use existing logic
    await this.deleteFromSupabase(fileUrl);
  },

  /**
   * Delete a file from local filesystem.
   * @param filePath - Relative or absolute file path
   */
  async deleteLocalFile(filePath: string): Promise<void> {
    try {
      // Convert relative path to absolute
      let absolutePath: string;
      if (path.isAbsolute(filePath)) {
        absolutePath = filePath;
      } else {
        // Handle both /uploads/cvs/... and uploads/cvs/...
        const normalizedPath = filePath.replace(/^\/?uploads\//, '');
        absolutePath = path.join(process.cwd(), 'uploads', normalizedPath);
      }
      
      console.log('🗑️ [Storage] Deleting local file:', absolutePath);
      
      // Check if file exists before deleting
      await fs.access(absolutePath);
      
      // Delete the file
      await fs.unlink(absolutePath);
      
      console.log('✅ [Storage] Local file deleted:', absolutePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn('⚠️ [Storage] File not found (already deleted?):', filePath);
        return; // Not an error if file doesn't exist
      }
      console.error('❌ [Storage] Failed to delete local file:', error.message);
      // Don't throw - local file deletion failure is not critical
    }
  },

  /**
   * Delete a file from Supabase Storage.
   * @param fileUrl - The full public URL of the file
   */
  async deleteFromSupabase(fileUrl: string): Promise<void> {
    try {
      // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/public/');
      
      if (pathParts.length < 2) {
        throw new Error('Invalid Supabase storage URL');
      }

      const fullPath = pathParts[1];
      if (!fullPath) {
        throw new Error('Invalid Supabase storage URL: path not found');
      }

      const bucket = fullPath.split('/')[0];
      if (!bucket) {
        throw new Error('Could not parse bucket from URL');
      }

      const filePath = fullPath.substring(bucket.length + 1);

      if (!filePath) {
        throw new Error('Could not parse file path from URL');
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([decodeURIComponent(filePath)]);

      if (error) {
        throw new Error(`Failed to delete file from bucket ${bucket}: ${error.message}`);
      }
    } catch (err) {
      console.error('Error deleting file from storage:', err);
      throw err;
    }
  }
};
