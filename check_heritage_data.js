const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeritageData() {
  try {
    console.log('Checking kakheti_heritage table data...');

    const { data, error } = await supabase
      .from('kakheti_heritage')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Error fetching data:', error);
      console.log('This might be an RLS issue. Error details:', error.message);
      return;
    }

    console.log('Query executed successfully');
    console.log('Data array:', data);
    console.log('Data length:', data?.length || 0);

  } catch (err) {
    console.error('Script error:', err);
  }
}

checkHeritageData();