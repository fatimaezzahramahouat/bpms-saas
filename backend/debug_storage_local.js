const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugStorage() {
  console.log('--- Supabase Storage Debug (Local) ---');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    // 1. List all buckets
    console.log('Listing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError.message);
    } else {
      console.log('Existing buckets:', buckets.map(b => b.name).join(', '));
    }

    // 2. Try to list files in "logos" bucket
    console.log('Listing files in "logos" bucket...');
    const { data: files, error: filesError } = await supabase.storage.from('logos').list('', {
      limit: 10,
    });

    if (filesError) {
      console.error('Error listing files in "logos" bucket:', filesError.message);
    } else {
      console.log('Recent files in "logos" bucket:', files ? files.map(f => f.name) : 'none');
    }

    // 3. Try to list files in "cv" bucket
    console.log('Listing files in "cv" bucket...');
    const { data: cvFiles, error: cvFilesError } = await supabase.storage.from('cv').list('cv', {
      limit: 10,
    });
    if (cvFilesError) {
      console.error('Error listing files in "cv" bucket:', cvFilesError.message);
    } else {
      console.log('Recent files in "cv" bucket (folder "cv"):', cvFiles ? cvFiles.map(f => f.name) : 'none');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

debugStorage();
