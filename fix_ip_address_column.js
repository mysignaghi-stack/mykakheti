require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixIpAddressColumn() {
  try {
    console.log('Testing current column type...');

    // First, try to insert with a valid IP to see if it works
    const { data: testData, error: testError } = await supabase.from('square_messages').insert({
      message: 'test message',
      sender_name: 'test user',
      ip_address: '127.0.0.1'
    });

    if (testError) {
      console.log('Insert with valid IP failed:', testError.message);

      // If it fails, the column might be text already or there's another issue
      console.log('Trying with text value...');
      const { data: testData2, error: testError2 } = await supabase.from('square_messages').insert({
        message: 'test message 2',
        sender_name: 'test user 2',
        ip_address: 'test_session_123'
      });

      if (testError2) {
        console.log('Insert with text failed:', testError2.message);
      } else {
        console.log('Text insert succeeded - column is text type');
        // Clean up
        await supabase.from('square_messages').delete().eq('message', 'test message 2');
      }
    } else {
      console.log('Valid IP insert succeeded - column is inet type');
      // Clean up
      await supabase.from('square_messages').delete().eq('message', 'test message');

      // Now try the actual session token format
      const testToken = 'anon_' + Math.random().toString(36).substr(2, 9);
      const { data: sessionData, error: sessionError } = await supabase.from('square_messages').insert({
        message: 'session test',
        sender_name: 'session user',
        ip_address: testToken
      });

      if (sessionError) {
        console.log('Session token insert failed:', sessionError.message);
        console.log('Column type needs to be changed to text');
      } else {
        console.log('Session token insert succeeded');
        await supabase.from('square_messages').delete().eq('message', 'session test');
      }
    }

  } catch (err) {
    console.log('Exception:', err.message);
  }
}

fixIpAddressColumn();