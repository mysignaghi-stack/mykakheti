require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixSquareMessagesRLS() {
  try {
    console.log('Fixing square_messages RLS policy...');

    // Drop the old policy
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Authenticated users can insert square messages" ON square_messages;`
    });

    if (dropError) {
      console.log('Drop policy error (might not exist):', dropError.message);
    }

    // Create the new policy
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Anyone can insert square messages" ON square_messages FOR INSERT WITH CHECK (true);`
    });

    if (createError) {
      console.log('Create policy error:', createError.message);

      // Try direct SQL execution
      const { data, error } = await supabase.from('square_messages').insert({
        message: 'test',
        sender_name: 'system'
      });

      if (error) {
        console.log('Insert test failed:', error.message);
      } else {
        console.log('Insert test succeeded, policy might already be correct');
        // Clean up test message
        await supabase.from('square_messages').delete().eq('message', 'test');
      }
    } else {
      console.log('Policy updated successfully!');
    }

  } catch (err) {
    console.log('Exception:', err.message);
  }
}

fixSquareMessagesRLS();