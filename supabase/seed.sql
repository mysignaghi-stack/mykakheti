-- Clear the existing data in the kakheti_heritage table
TRUNCATE TABLE kakheti_heritage;

-- Insert new data with only "Did you know" information
INSERT INTO kakheti_heritage (title, category, description, fun_fact, created_at)
VALUES
  ('Historical Monument 1', 'ისტორია', 'Description of Monument 1', 'Did you know fact about Monument 1', NOW()),
  ('Historical Monument 2', 'ისტორია', 'Description of Monument 2', 'Did you know fact about Monument 2', NOW()),
  ('Historical Monument 3', 'ისტორია', 'Description of Monument 3', 'Did you know fact about Monument 3', NOW());

-- Sample admin posts for testing
INSERT INTO admin_posts (title, content, category, badge_text, created_at) VALUES
('კახეთის რეგიონის განვითარების გეგმა', 'საქართველოს მთავრობა აცხადებს კახეთის რეგიონის სოფლის მეურნეობის განვითარების ახალ პროგრამას. პროგრამა მოიცავს მევენახეებისთვის სახელმწიფო დახმარებას, ახალი საწარმოების დაფინანსებას და ტურიზმის განვითარებას.', 'სახელმწიფო პროგრამები', 'ოფიციალური განცხადება', NOW() - INTERVAL '2 days'),

('საგზაო სამუშაოები თელავში', 'დაწყებულია საგზაო სამუშაოები თელავის მუნიციპალიტეტში. სამუშაოები მოიცავს ქალაქის ცენტრალური ქუჩების რეაბილიტაციას და საფეხმავლო ბილიკების მოწყობას. სამუშაოები დასრულდება 2026 წლის მარტში.', 'ინფრასტრუქტურა', 'მიმდინარე სამუშაოები', NOW() - INTERVAL '1 day'),

('ახალი სასწავლო პროგრამა სოფლის მეურნეობაში', 'თელავის სასოფლო-სამეურნეო კოლეჯი აცხადებს ახალ სასწავლო პროგრამას "მევენახეობა და ღვინის წარმოება". პროგრამა მოიცავს თეორიულ და პრაქტიკულ სწავლებას. რეგისტრაცია მიმდინარეობს.', 'განათლება', 'სასწავლო პროგრამა', NOW() - INTERVAL '3 hours'),

('კახეთის ტურისტული რუკა განახლდა', 'გამოქვეყნდა კახეთის რეგიონის ტურისტული რუკის განახლებული ვერსია. რუკა შეიცავს ახალ ტურისტულ მარშრუტებს, სასტუმროებს და რესტორნებს. რუკა ხელმისაწვდომია ციფრულ და პაერ ფორმატში.', 'ტურიზმი', 'ახალი გამოშვება', NOW() - INTERVAL '6 hours'),

('ენერგოეფექტურობის პროგრამა', 'დაწყებულია სახლების ენერგოეფექტურობის ამაღლების პროგრამა კახეთის რეგიონში. პროგრამის ფარგლებში მოხდება სახურავების იზოლაცია, ფანჯრების ჩანაცვლება და გათბობის სისტემების მოდერნიზაცია.', 'ენერგეტიკა', 'სახელმწიფო პროგრამა', NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- Sample announcements
INSERT INTO announcements (title, description, category, location, price, currency, contact_info, phone, is_approved, created_at) VALUES
('ვაყიდი სახლს თელავში', 'მაღალი ხარისხის სახლი 200 კვ.მ. ფართობით, 4 ოთახი, სამზარეულო, აბაზანა. ეზო 500 კვ.მ.', 'უძრავი ქონება', 'თელავი', '150000', 'GEL', 'გიორგი, +995 555 123456', '+995 555 123456', true, NOW() - INTERVAL '1 day'),
('იყიდება მანქანა', 'Mercedes-Benz C-Class 2018 წელი, 2.0 ლიტრი, ავტომატიკა, 150000 კმ. ფერი შავი.', 'ავტომობილები', 'თელავი', '25000', 'USD', 'ნიკა, +995 577 654321', '+995 577 654321', true, NOW() - INTERVAL '2 hours'),
('ვაქირავებ ბინას', '2 ოთახიანი ბინა ცენტრში, ავეჯი, ტელევიზორი, ინტერნეტი. ყოველთვიური გადასახადი 500 ლარი.', 'გაქირავება', 'თელავი', '500', 'GEL', 'მარიამ, +995 599 987654', '+995 599 987654', true, NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;