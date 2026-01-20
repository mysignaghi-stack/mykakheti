const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugHeritageTable() {
  try {
    console.log('=== Debugging kakheti_heritage table ===');

    // Try to get table info
    console.log('\n1. Checking table accessibility...');
    const { data: testData, error: testError } = await supabase
      .from('kakheti_heritage')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Table access error:', testError);
    } else {
      console.log('Table is accessible');
    }

    // Try to insert a single test item
    console.log('\n2. Trying to insert a single test item...');
    const testItem = {
      category: 'ისტორია',
      title: 'Test Item',
      description: 'This is a test item',
      location_name: 'Test Location'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('kakheti_heritage')
      .insert(testItem)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      console.log('Error code:', insertError.code);
      console.log('Error message:', insertError.message);
      console.log('Error details:', insertError.details);
    } else {
      console.log('Insert successful!');
      console.log('Inserted data:', insertData);
    }

    // Try to read back
    console.log('\n3. Trying to read back the data...');
    const { data: readData, error: readError } = await supabase
      .from('kakheti_heritage')
      .select('*')
      .eq('title', 'Test Item');

    if (readError) {
      console.error('Read error:', readError);
    } else {
      console.log('Read successful!');
      console.log('Found items:', readData?.length || 0);
      if (readData && readData.length > 0) {
        console.log('Data:', readData);
      }
    }

    // Try to read all data
    console.log('\n4. Trying to read all data...');
    const { data: allData, error: allError } = await supabase
      .from('kakheti_heritage')
      .select('*');

    if (allError) {
      console.error('Read all error:', allError);
    } else {
      console.log('Read all successful!');
      console.log('Total items in table:', allData?.length || 0);
    }

  } catch (err) {
    console.error('Script error:', err);
  }
}

debugHeritageTable();