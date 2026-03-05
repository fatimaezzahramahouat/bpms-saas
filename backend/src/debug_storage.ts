import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugStorage() {
  console.log('--- Supabase Storage Debug ---');
  
  // 1. List all buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError.message);
  } else if (buckets) {
    console.log('Existing buckets:', buckets.map((b: any) => b.name).join(', '));
  }

  // 2. Try to list files in "logos" bucket
  const { data: files, error: filesError } = await supabase.storage.from('logos').list('', {
    limit: 10,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (filesError) {
    console.error('Error listing files in "logos" bucket:', filesError.message);
  } else if (files) {
    console.log('Recent files in "logos" bucket:', files.map((f: any) => f.name));
  }

  // 3. Try to list files in "cv" bucket just for comparison
  const { data: cvFiles, error: cvFilesError } = await supabase.storage.from('cv').list('cv', {
    limit: 10,
  });
  if (!cvFilesError && cvFiles) {
    console.log('Recent files in "cv" bucket (folder "cv"):', cvFiles.map((f: any) => f.name));
  }
}

debugStorage();
