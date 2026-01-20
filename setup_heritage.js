const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupHeritageData() {
  try {
    console.log('Setting up kakheti_heritage table...');

    // First, try to update the table schema
    console.log('Updating table constraints...');

    // Note: We'll need to run the SQL manually or use raw SQL
    // For now, let's try to insert and see what happens

    console.log('Checking existing data...');
    const { data: existingData, error: checkError } = await supabase
      .from('kakheti_heritage')
      .select('id, title')
      .limit(5);

    if (checkError) {
      console.error('Error checking table:', checkError.message);
      return;
    }

    console.log('Existing data count:', existingData?.length || 0);

    if (existingData && existingData.length > 0) {
      console.log('Data already exists, skipping insert');
      return;
    }

    console.log('Inserting heritage data...');

    // Insert data with correct categories
    const heritageData = [
      {
        category: 'ისტორია',
        title: 'გრემის მთავარანგელოზთა კომპლექსი',
        description: 'XVI საუკუნის ეს დიდებული ციხე-სიმაგრე კახეთის სამეფოს დედაქალაქი იყო.',
        fun_fact: 'იცოდით, რომ გრემი ერთ დროს აბრეშუმის გზის მნიშვნელოვანი სავაჭრო ჰაბი იყო?',
        image_url: 'https://images.unsplash.com/photo-1590272456521-1bbe160a18ce',
        location_name: 'გრემი'
      },
      {
        category: 'ისტორია',
        title: 'ალავერდის მონასტერი',
        description: 'XI საუკუნის ხუროთმოძღვრების ძეგლი.',
        fun_fact: 'იცოდით, რომ ალავერდი საქართველოში ერთ-ერთი უძველესი საგანმანათლებლო ცენტრი იყო?',
        image_url: 'https://images.unsplash.com/photo-1628150490581-22878415712e',
        location_name: 'ალავერდი'
      },
      {
        category: 'ბუნება',
        title: 'ლაგოდეხის ჩანჩქერები',
        description: 'ნაკრძალის ტერიტორიაზე მდებარეობს ულამაზესი ჩანჩქერები.',
        fun_fact: 'იცოდით, რომ ლაგოდეხის ნაკრძალი საქართველოში პირველი დაცული ტერიტორიაა?',
        image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        location_name: 'ლაგოდეხი'
      },
      {
        category: 'ღვინის კულტურა',
        title: 'ქვევრის დამზადების ტრადიცია',
        description: 'კახური მეღვინეობის საფუძველი ქვევრია.',
        fun_fact: 'იცოდით, რომ იუნესკომ ქვევრის ღვინის დაყენების მეთოდს მემკვიდრეობის სტატუსი მიანიჭა?',
        image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
        location_name: 'ვარდისუბანი'
      },
      {
        category: 'ცნობილი ადამიანები',
        title: 'მეფე ერეკლე II',
        description: 'კახეთის ლეგენდარული მეფე.',
        fun_fact: 'იცოდით, რომ ერეკლე II-მ 80-მდე ბრძოლა გადაიხადა?',
        image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f',
        location_name: 'თელავი'
      }
    ];

    const { data, error } = await supabase
      .from('kakheti_heritage')
      .insert(heritageData);

    if (error) {
      console.error('Error inserting data:', error);
      console.log('This might be due to RLS policies. You may need to run the SQL fix script manually in Supabase.');
    } else {
      console.log('Successfully inserted', data?.length || 0, 'heritage items');
    }

  } catch (err) {
    console.error('Script error:', err);
  }
}

setupHeritageData();