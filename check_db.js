require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  const tables = ['congratulations', 'lost_found', 'masters', 'obituaries', 'agro_prices'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.log(`${table}: Error - ${error.message}`);
      } else {
        console.log(`${table}: ${data.length} records`);
        if (data.length > 0) {
          console.log('Sample:', JSON.stringify(data[0], null, 2));
        }
      }
    } catch (err) {
      console.log(`${table}: Exception - ${err.message}`);
    }
  }
}

checkTables();
