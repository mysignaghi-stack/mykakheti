const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndInsertHeritageData() {
  try {
    // First check if table exists and has data
    console.log('Checking kakheti_heritage table...');
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
      console.log('Sample existing data:', existingData);
      return;
    }

    console.log('No data found. Inserting heritage data...');

    // Insert data from the SQL file
    const heritageData = [
      // History category (10 items)
      {
        category: 'ისტორია',
        title: 'გრემის მთავარანგელოზთა კომპლექსი',
        description: 'XVI საუკუნის ეს დიდებული ციხე-სიმაგრე კახეთის სამეფოს დედაქალაქი იყო. დღეს ის რეგიონის ერთ-ერთი ყველაზე შთამბეჭდავი ვიზუალური სიმბოლოა.',
        fun_fact: 'იცოდით, რომ გრემი ერთ დროს აბრეშუმის გზის მნიშვნელოვანი სავაჭრო ჰაბი იყო და მას საკუთარი წყალმომარაგების სისტემა ჰქონდა?',
        image_url: 'https://images.unsplash.com/photo-1590272456521-1bbe160a18ce',
        location_name: 'გრემი'
      },
      {
        category: 'ისტორია',
        title: 'ალავერდის მონასტერი',
        description: 'XI საუკუნის ხუროთმოძღვრების ძეგლი, რომელიც საუკუნეების განმავლობაში საქართველოში ყველაზე მაღალ ნაგებობად ითვლებოდა.',
        fun_fact: 'იცოდით, რომ ალავერდი საქართველოში ერთ-ერთი უძველესი საგანმანათლებლო ცენტრი იყო და აქ ხელნაწერთა გადაწერა ხდებოდა?',
        image_url: 'https://images.unsplash.com/photo-1628150490581-22878415712e',
        location_name: 'ალავერდი'
      },
      {
        category: 'ისტორია',
        title: 'სიღნაღის ციხე-გალავანი',
        description: 'XVIII საუკუნეში ერეკლე II-ის მიერ აშენებული გალავანი, რომელსაც 23 კოშკი და 6 ჭიშკარი აქვს. ის ერთ-ერთი ყველაზე დიდია ევროპაში.',
        fun_fact: 'იცოდით, რომ სიღნაღის გალავნის თითოეულ კოშკს ახლომდებარე სოფლის სახელი ერქვა, რადგან ომის დროს სოფლის მოსახლეობა თავის კოშკს იცავდა?',
        image_url: 'https://images.unsplash.com/photo-1565620851603-467434151755',
        location_name: 'სიღნაღი'
      },
      {
        category: 'ისტორია',
        title: 'ნეკრესის სამონასტრო კომპლექსი',
        description: 'კომპლექსი, რომელიც აერთიანებს სხვადასხვა ეპოქის ნაგებობებს. აქ მდებარეობს საქართველოში შემორჩენილი ერთ-ერთი უძველესი მცირე ბაზილიკა.',
        fun_fact: 'იცოდით, რომ ნეკრესის მონასტერი მთის წვერზეა გაშენებული და აქედან ალაზნის ველის ულამაზესი ხედი იშლება?',
        image_url: 'https://images.unsplash.com/photo-1632766329774-681534960337',
        location_name: 'ყვარელი'
      },
      {
        category: 'ისტორია',
        title: 'იყალთოს აკადემია',
        description: 'XII საუკუნეში დაარსებული აკადემია, სადაც ასწავლიდნენ ფილოსოფიას, რიტორიკას, მჭედლობასა და მეღვინეობას.',
        fun_fact: 'იცოდით, რომ გადმოცემის თანახმად, იყალთოს აკადემიაში სწავლობდა დიდი ქართველი პოეტი შოთა რუსთაველი?',
        image_url: 'https://images.unsplash.com/photo-1610484826967-09c5720778c7',
        location_name: 'იყალთო'
      },
      // Add more items here... (I'll add a few more for testing)
      {
        category: 'ბუნება',
        title: 'ლაგოდეხის ჩანჩქერები',
        description: 'ნაკრძალის ტერიტორიაზე მდებარეობს "როჭოს" და "გურგენიანის" ულამაზესი ჩანჩქერები, რომლებიც ხელუხლებელ ბუნებაშია ჩაფლული.',
        fun_fact: 'იცოდით, რომ ლაგოდეხის ნაკრძალი საქართველოში პირველი დაცული ტერიტორიაა, რომელიც 1912 წელს დაარსდა?',
        image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        location_name: 'ლაგოდეხი'
      },
      {
        category: 'ღვინის კულტურა',
        title: 'ქვევრის დამზადების ტრადიცია',
        description: 'კახური მეღვინეობის საფუძველი ქვევრია. სოფელ ვარდისუბანში დღემდე ცხოვრობენ მექვევრეები, რომლებიც ამ ხელობას თაობიდან თაობას გადასცემენ.',
        fun_fact: 'იცოდით, რომ იუნესკომ ქვევრის ღვინის დაყენების მეთოდს არამატერიალური კულტურული მემკვიდრეობის სტატუსი მიანიჭა?',
        image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
        location_name: 'ვარდისუბანი'
      }
    ];

    const { data, error } = await supabase
      .from('kakheti_heritage')
      .insert(heritageData);

    if (error) {
      console.error('Error inserting data:', error);
    } else {
      console.log('Successfully inserted', data?.length || 0, 'heritage items');
    }

  } catch (err) {
    console.error('Script error:', err);
  }
}

checkAndInsertHeritageData();