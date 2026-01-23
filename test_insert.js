const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  const { error } = await supabase.from('announcements').insert({
    title: 'ტესტი განცხადება',
    description: 'ეს არის ტესტი განცხადება',
    price: 100,
    currency: 'GEL',
    location: 'თელავი',
    category: 'უძრავი ქონება',
    contact_info: 'test@example.com',
    phone: '555-1234',
    is_approved: true
  });
  console.log('Insert error:', error);
})();