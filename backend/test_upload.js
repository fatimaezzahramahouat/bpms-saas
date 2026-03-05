const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testUpload() {
  console.log('--- Supabase Upload Test ---');
  const bucketName = 'logos';
  const fileName = `test_logo_${Date.now()}.png`;
  const filePath = fileName;
  const dummyBuffer = Buffer.from('test image content');
  
  console.log(`Uploading ${fileName} to bucket ${bucketName}...`);
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, dummyBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success:', data);
    
    // Check if it's actually there
    const { data: files, error: listError } = await supabase.storage.from(bucketName).list();
    if (listError) {
      console.error('List Error:', listError);
    } else {
      console.log('Files in bucket:', files.map(f => f.name));
    }
  }
}

testUpload();
