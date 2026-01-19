export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[40px] border border-white/10 shadow-2xl">
          <h1 className="text-3xl font-black text-amber-500 uppercase italic tracking-tighter leading-none mb-8">
            პრივატულობის პოლიტიკა
          </h1>
          <div className="space-y-6 text-white/80 leading-relaxed">
            <p className="text-lg">
              MyKakheti პატივს სცემს მომხმარებლის პრივატულობას.
            </p>
            <p>
              ჩვენ ვინახავთ მხოლოდ თქვენს სახელს და მეილს ავტორიზაციისთვის.
            </p>
            <p>
              მონაცემების წაშლა: თუ გსურთ თქვენი მონაცემების წაშლა ჩვენი ბაზიდან, გთხოვთ მოგვწეროთ ელ-ფოსტაზე: mysignaghi@gmail.com ან წაშალოთ აპლიკაცია თქვენი Facebook-ის პარამეტრებიდან (Settings &gt; Apps and Websites).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}