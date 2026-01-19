// Script to check available tables in Supabase
// Run this in your browser console when logged into Supabase Dashboard

// This will show you all available tables
const checkTables = async () => {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_type', 'VIEW');

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Available tables:', data.map(t => t.table_name));
    }
  } catch (err) {
    console.error('Error checking tables:', err);
  }
};

checkTables();