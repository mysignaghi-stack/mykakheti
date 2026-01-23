const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertAllHeritageData() {
  try {
    console.log('Checking if table is ready...');

    // Check if we can insert (RLS should be disabled or policy should allow)
    const { data: testData, error: testError } = await supabase
      .from('kakheti_heritage')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Table not accessible:', testError.message);
      console.log('Make sure you ran the SQL commands in Supabase Dashboard first.');
      return;
    }

    console.log('Table is accessible. Inserting all heritage data...');

    // Full dataset from the SQL file
    const heritageData = [
      // History (10 items)
      { category: 'ისტორია', title: 'გრემის მთავარანგელოზთა კომპლექსი', description: 'XVI საუკუნის ეს დიდებული ციხე-სიმაგრე კახეთის სამეფოს დედაქალაქი იყო. დღეს ის რეგიონის ერთ-ერთი ყველაზე შთამბეჭდავი ვიზუალური სიმბოლოა.', fun_fact: 'იცოდით, რომ გრემი ერთ დროს აბრეშუმის გზის მნიშვნელოვანი სავაჭრო ჰაბი იყო და მას საკუთარი წყალმომარაგების სისტემა ჰქონდა?', image_url: 'https://images.unsplash.com/photo-1590272456521-1bbe160a18ce', location_name: 'გრემი' },
      { category: 'ისტორია', title: 'ალავერდის მონასტერი', description: 'XI საუკუნის ხუროთმოძღვრების ძეგლი, რომელიც საუკუნეების განმავლობაში საქართველოში ყველაზე მაღალ ნაგებობად ითვლებოდა.', fun_fact: 'იცოდით, რომ ალავერდი საქართველოში ერთ-ერთი უძველესი საგანმანათლებლო ცენტრი იყო და აქ ხელნაწერთა გადაწერა ხდებოდა?', image_url: 'https://images.unsplash.com/photo-1628150490581-22878415712e', location_name: 'ალავერდი' },
      { category: 'ისტორია', title: 'სიღნაღის ციხე-გალავანი', description: 'XVIII საუკუნეში ერეკლე II-ის მიერ აშენებული გალავანი, რომელსაც 23 კოშკი და 6 ჭიშკარი აქვს. ის ერთ-ერთი ყველაზე დიდია ევროპაში.', fun_fact: 'იცოდით, რომ სიღნაღის გალავნის თითოეულ კოშკს ახლომდებარე სოფლის სახელი ერქვა, რადგან ომის დროს სოფლის მოსახლეობა თავის კოშკს იცავდა?', image_url: 'https://images.unsplash.com/photo-1565620851603-467434151755', location_name: 'სიღნაღი' },
      { category: 'ისტორია', title: 'ნეკრესის სამონასტრო კომპლექსი', description: 'კომპლექსი, რომელიც აერთიანებს სხვადასხვა ეპოქის ნაგებობებს. აქ მდებარეობს საქართველოში შემორჩენილი ერთ-ერთი უძველესი მცირე ბაზილიკა.', fun_fact: 'იცოდით, რომ ნეკრესის მონასტერი მთის წვერზეა გაშენებული და აქედან ალაზნის ველის ულამაზესი ხედი იშლება?', image_url: 'https://images.unsplash.com/photo-1632766329774-681534960337', location_name: 'ყვარელი' },
      { category: 'ისტორია', title: 'იყალთოს აკადემია', description: 'XII საუკუნეში დაარსებული აკადემია, სადაც ასწავლიდნენ ფილოსოფიას, რიტორიკას, მჭედლობასა და მეღვინეობას.', fun_fact: 'იცოდით, რომ გადმოცემის თანახმად, იყალთოს აკადემიაში სწავლობდა დიდი ქართველი პოეტი შოთა რუსთაველი?', image_url: 'https://images.unsplash.com/photo-1610484826967-09c5720778c7', location_name: 'იყალთო' },
      { category: 'ისტორია', title: 'უჯარმის ციხე', description: 'ადრეფეოდალური ხანის ციხე-ქალაქი, რომელიც ვახტანგ გორგასლის დროს ქვეყნის ერთ-ერთი უმნიშვნელოვანესი პოლიტიკური ცენტრი იყო.', fun_fact: 'იცოდით, რომ მეფე ვახტანგ გორგასალმა სიცოცხლის ბოლო წლები სწორედ უჯარმის ციხეში გაატარა?', image_url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b', location_name: 'უჯარმა' },
      { category: 'ისტორია', title: 'ბოდბის მონასტერი', description: 'აქ განისვენებს წმინდა ნინო, ქართველთა განმანათლებელი. მონასტერი კახეთის უმთავრესი მომლოცველობითი ცენტრია.', fun_fact: 'იცოდით, რომ ბოდბის ტაძრის ქვემოთ მდებარეობს წმინდა ნინოს წყარო, რომელსაც ადგილობრივები სამკურნალო თვისებებს მიაწერენ?', image_url: 'https://images.unsplash.com/photo-1582042784795-364e0366624a', location_name: 'ბოდბე' },
      { category: 'ისტორია', title: 'ხორნაბუჯის ციხე', description: 'კლდეზე გაშენებული მიუვალი ციხე-სიმაგრე, რომელსაც "თამარის ციხესაც" უწოდებენ. ის დედოფლისწყაროსთან მდებარეობს.', fun_fact: 'იცოდით, რომ ხორნაბუჯი იმდენად მაღალ კლდეზეა, რომ მასზე ასვლა ნამდვილი ალპინისტური თავგადასავალია?', image_url: 'https://images.unsplash.com/photo-1598453472097-f58694a961f5', location_name: 'დედოფლისწყარო' },
      { category: 'ისტორია', title: 'ძველი და ახალი შუამთა', description: 'ორი სამონასტრო კომპლექსი, რომელიც ტყეშია ჩაფლული. ძველი შუამთა V-VII საუკუნეებისაა, ახალი კი XVI საუკუნის.', fun_fact: 'იცოდით, რომ ახალი შუამთა კახეთის დედოფალმა თინათინმა ააგო მას შემდეგ, რაც ხილვა ნახა, თუ სად უნდა აეშენებინა ტაძარი?', image_url: 'https://images.unsplash.com/photo-1610484826917-0f101a7bf7f4', location_name: 'თელავი' },
      { category: 'ისტორია', title: 'ნინოწმინდის ტაძარი', description: 'VI საუკუნის ტაძარი, რომელიც ქართული ხუროთმოძღვრების განვითარების ერთ-ერთი უმნიშვნელოვანესი ეტაპია.', fun_fact: 'იცოდით, რომ ნინოწმინდის ტაძარი თავდაპირველად უზარმაზარი გუმბათოვანი ნაგებობა იყო, რომელიც მიწისძვრამ დააზიანა?', image_url: 'https://images.unsplash.com/photo-1635332219808-72b158580234', location_name: 'საგარეჯო' },

      // Nature (10 items)
      { category: 'ბუნება', title: 'ლაგოდეხის ჩანჩქერები', description: 'ნაკრძალის ტერიტორიაზე მდებარეობს "როჭოს" და "გურგენიანის" ულამაზესი ჩანჩქერები, რომლებიც ხელუხლებელ ბუნებაშია ჩაფლული.', fun_fact: 'იცოდით, რომ ლაგოდეხის ნაკრძალი საქართველოში პირველი დაცული ტერიტორიაა, რომელიც 1912 წელს დაარსდა?', image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', location_name: 'ლაგოდეხი' },
      { category: 'ბუნება', title: 'ვაშლოვანის ტალახის ვულკანები', description: 'უჩვეულო ლანდშაფტი დედოფლისწყაროსთან, რომელიც მარსის ზედაპირს მოგაგონებთ. აქ ტალახის პატარა კრატერები მუდმივად "დუღს".', fun_fact: 'იცოდით, რომ ვაშლოვანის ტალახის ვულკანებიდან ამოსული მასა სამკურნალო თვისებებისაა და კოსმეტოლოგიაშიც გამოიყენება?', image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', location_name: 'დედოფლისწყარო' },
      { category: 'ბუნება', title: 'ლოპოტის ტბა', description: 'მთებს შორის მოქცეული ულამაზესი ტბა, რომელიც დასვენების საყვარელ ადგილად იქცა.', fun_fact: 'იცოდით, რომ ლოპოტას ტბის გარშემო არსებული მიკროკლიმატი განსაკუთრებით სასარგებლოა ჯანმრთელობისთვის?', image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', location_name: 'თელავი' },
      { category: 'ბუნება', title: 'ყვარლის ტბა', description: 'მდინარე დურუჯის ხეობაში მდებარე ტბა, რომელიც გარშემორტყმულია საუკუნოვანი ტყეებით.', fun_fact: 'იცოდით, რომ ყვარლის ტბაზე ჩამოსული ნისლი ხშირად ქმნის მისტიკურ გარემოს, რაც ფოტოგრაფების საყვარელი სანახაობაა?', image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', location_name: 'ყვარელი' },
      { category: 'ბუნება', title: 'არწივის ხეობა', description: 'კირქვიანი კლდეების ხეობა, სადაც იშვიათი ჯიშის მტაცებელი ფრინველები ბინადრობენ.', fun_fact: 'იცოდით, რომ არწივის ხეობაში შეგიძლიათ იხილოთ იშვიათი მცენარე - კახური მაჩიტა, რომელიც სხვაგან არსად იზრდება?', image_url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e', location_name: 'დედოფლისწყარო' },

      // Wine Culture (10 items)
      { category: 'ღვინო', title: 'ქვევრის დამზადების ტრადიცია', description: 'კახური მეღვინეობის საფუძველი ქვევრია. სოფელ ვარდისუბანში დღემდე ცხოვრობენ მექვევრეები, რომლებიც ამ ხელობას თაობიდან თაობას გადასცემენ.', fun_fact: 'იცოდით, რომ იუნესკომ ქვევრის ღვინის დაყენების მეთოდს არამატერიალური კულტურული მემკვიდრეობის სტატუსი მიანიჭა?', image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3', location_name: 'ვარდისუბანი' },
      { category: 'ღვინო', title: 'რქაწითელი - კახეთის ოქრო', description: 'თეთრი ყურძნის ჯიში, რომელიც კახეთში ყველაზე მეტადაა გავრცელებული და მისგან საუკეთესო ქვევრის ღვინო დგება.', fun_fact: 'იცოდით, რომ რქაწითელი ერთ-ერთი უძველესი ჯიშია მსოფლიოში და მისი წიპწები ნეოლითის ხანის ნამოსახლარებშია ნაპოვნი?', image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b0ca7ef', location_name: 'ალაზნის ველი' },
      { category: 'ღვინო', title: 'საფერავი - ქართული სიამაყე', description: 'წითელი ყურძნის ჯიში, რომელსაც "თვითმღებავს" უწოდებენ, რადგან მისი რბილობიც კი შეფერილია.', fun_fact: 'იცოდით, რომ საფერავი ერთ-ერთია იმ მცირერიცხოვან ჯიშებს შორის, რომლისგანაც ექსტრემალურად მუქი, თითქმის შავი ღვინო მიიღება?', image_url: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0', location_name: 'კახეთი' },

      // Famous People (10 items)
      { category: 'პერსონაჟი', title: 'მეფე ერეკლე II', description: 'კახეთის ლეგენდარული მეფე, "პატარა კახი", რომელიც მთელი ცხოვრება ბრძოლებში გაატარა ქვეყნის გადასარჩენად.', fun_fact: 'იცოდით, რომ ერეკლე II-მ 80-მდე დიდი და მცირე ბრძოლა გადაიხადა და თითქმის ყოველთვის გამარჯვებული გამოდიოდა?', image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f', location_name: 'თელავი' },
      { category: 'პერსონაჟი', title: 'ნიკო ფიროსმანი', description: 'გენიალური თვითნასწავლი მხატვარი მირზაანიდან, რომლის ნახატებმაც მსოფლიო აღიარება მოიპოვა.', fun_fact: 'იცოდით, რომ ფიროსმანის ცნობილი ისტორია "მილიონი ვარდის" შესახებ ნამდვილ ამბავს ეფუძნება, რომელიც მას ფრანგი მსახიობის მიმართ ჰქონდა?', image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5', location_name: 'მირზაანი' },
      { category: 'პერსონაჟი', title: 'ალექსანდრე ჭავჭავაძე', description: 'პოეტი, გენერალი და საზოგადო მოღვაწე, რომელმაც წინანდლის მამული კულტურული ცენტრად აქცია.', fun_fact: 'იცოდით, რომ ალექსანდრე ჭავჭავაძემ პირველმა შემოიტანა საქართველოში ფორტეპიანო და ევროპული ეტლი?', image_url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744', location_name: 'წინანდალი' },

      // Legends (5 items for now)
      { category: 'ლეგენდა', title: 'სიღნაღი - სიყვარულის ქალაქი', description: 'ლეგენდა ამბობს, რომ სიღნაღში ნებისმიერ დროს შეგიძლიათ დაქორწინება და აქაური ჰაერი სიყვარულითაა გაჟღენთილი.', fun_fact: 'იცოდით, რომ სიღნაღში ქორწინების სახლი 24 საათის განმავლობაში მუშაობს და ნებისმიერ მსურველს იღებს?', image_url: 'https://images.unsplash.com/photo-1565620851603-467434151755', location_name: 'სიღნაღი' }
    ];

    // Insert in batches to avoid payload size limits
    const batchSize = 10;
    let totalInserted = 0;

    for (let i = 0; i < heritageData.length; i += batchSize) {
      const batch = heritageData.slice(i, i + batchSize);
      console.log(`Inserting batch ${Math.floor(i/batchSize) + 1} (${batch.length} items)...`);

      const { data, error } = await supabase
        .from('kakheti_heritage')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        console.log('Error details:', JSON.stringify(error, null, 2));
        break;
      } else {
        console.log(`Batch ${Math.floor(i/batchSize) + 1} result:`, data);
        totalInserted += data?.length || 0;
      }
    }

    console.log(`Total items inserted: ${totalInserted}`);

  } catch (err) {
    console.error('Script error:', err);
  }
}

insertAllHeritageData();