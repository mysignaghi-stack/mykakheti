'use client';

export default function RulesPage() {
  const rules = [
    {
      title: "01. ზოგადი პირობები",
      text: "MYKAKHETI.GE არის კახეთის რეგიონის ერთიანი ციფრული პლატფორმა. საიტით სარგებლობა ნიშნავს, რომ თქვენ ეთანხმებით წინამდებარე წესებსა და პირობებს. ადმინისტრაცია იტოვებს უფლებას, ნებისმიერ დროს შეიტანოს ცვლილებები ტექსტში."
    },
    {
      title: "02. განცხადების განთავსება",
      text: "განცხადების სათაური და აღწერა უნდა იყოს ზუსტი და უტყუარი. აკრძალულია ერთი და იმავე შინაარსის განცხადების განმეორებით ატვირთვა სხვადასხვა კატეგორიაში. მომხმარებელი პასუხისმგებელია მის მიერ მითითებულ საკონტაქტო ნომერზე."
    },
    {
      title: "03. ფოტომასალის ხარისხი",
      text: "ატვირთული სურათები უნდა ასახავდეს რეალურ პროდუქტს ან მომსახურებას. იკრძალება ინტერნეტიდან აღებული, სხვისი საკუთრების მქონე ან შეურაცხმყოფელი ფოტოების გამოყენება. სისტემა ავტომატურად ახდენს ფოტოების ოპტიმიზაციას საიტის სისწრაფისთვის."
    },
    {
      title: "04. აკრძალული კატეგორიები",
      text: "პლატფორმაზე კატეგორიულად იკრძალება იარაღის, ასაფეთქებელი ნივთიერებების, ნარკოტიკული საშუალებების, ფსიქოტროპული ნივთიერებებისა და საქართველოს კანონმდებლობით აკრძალული ნებისმიერი ნივთის ან მომსახურების რეკლამირება."
    },
    {
      title: "05. მოდერაცია და უსაფრთხოება",
      text: "ყოველი განცხადება გადის მოდერაციას. ადმინისტრატორი უფლებამოსილია, ყოველგვარი ახსნა-განმარტების გარეშე წაშალოს განცხადება, რომელიც არღვევს საიტის სტანდარტებს ან შეიცავს საეჭვო ინფორმაციას."
    },
    {
      title: "06. პასუხისმგებლობის შეზღუდვა",
      text: "MYKAKHETI.GE წარმოადგენს მხოლოდ შუამავალ პლატფორმას. ჩვენ არ ვაგებთ პასუხს გამყიდველსა და მყიდველს შორის შემდგარ გარიგებაზე, პროდუქციის ხარისხზე ან ფინანსურ ტრანზაქციებზე. სიფრთხილე გამოიჩინეთ პირადი მონაცემების გაზიარებისას."
    }
  ];

  return (
    <main className="min-h-screen bg-[#050510] text-white font-sans pb-32 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent opacity-50" />
      
      <nav className="relative z-50 px-10 py-10 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-3xl">
        <a href="/" className="text-2xl font-black italic tracking-tighter drop-shadow-md">mykakheti<span className="text-amber-500">.ge</span></a>
        <a href="/" className="bg-white text-black px-10 py-3 rounded-2xl text-[11px] font-black uppercase italic hover:bg-amber-500 hover:text-white transition-all shadow-2xl">← მთავარზე</a>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto mt-24 px-8">
        <div className="mb-20 text-center">
          <h1 className="text-6xl md:text-8xl font-black uppercase italic mb-6 tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,1)]">
            საიტის <span className="text-amber-500">წესები</span>
          </h1>
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.5em] italic">წაიკითხეთ ყურადღებით პლატფორმით სარგებლობამდე</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rules.map((rule, i) => (
            <div key={i} className="bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[50px] border border-white/10 shadow-2xl hover:border-amber-500/50 transition-all duration-500 group">
              <h2 className="text-xl font-black uppercase italic text-amber-500 mb-6 tracking-widest group-hover:scale-105 transition-transform origin-left">{rule.title}</h2>
              <p className="text-[15px] font-black text-white/90 leading-relaxed italic uppercase tracking-tight opacity-80 group-hover:opacity-100 transition-opacity">{rule.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 p-12 bg-amber-600 rounded-[50px] text-center shadow-[0_20px_50px_-10px_rgba(217,119,6,0.4)]">
          <h3 className="text-2xl font-black uppercase italic mb-4">გაქვთ კითხვები?</h3>
          <p className="text-white/90 font-black italic uppercase text-sm mb-0">მოგვწერეთ ელ-ფოსტაზე: INFO@MYKAKHETI.GE</p>
        </div>
      </div>
    </main>
  );
}