export type FacilityType = "hospital" | "diagnostic";

export type Facility = {
  id: string;
  kind: FacilityType;
  name_bn: string;
  name_en: string | null;
  division_bn: string;
  district_bn: string;
  upazila_area: string;
  address_bn: string;
  phone: string;
  hours_bn: string;
  created_at: string;
};

const T = "2026-10-07T00:00:00.000Z";

function f(
  id: string,
  kind: FacilityType,
  name_en: string,
  name_bn: string,
  division_bn: string,
  district_bn: string,
  area: string,
  address: string,
  phone: string,
): Facility {
  return {
    id,
    kind,
    name_bn,
    name_en,
    division_bn,
    district_bn,
    upazila_area: area,
    address_bn: address,
    phone,
    hours_bn: "প্রতিদিন সকাল ৯টা – রাত ৯টা",
    created_at: T,
  };
}

// Nationwide starter (~60). Popular / well-known only — addresses are
// area-level, phone = public hotline where known else "". Admin can edit.
export const FACILITIES: Facility[] = [
  // ── Dhaka division ──
  f("h-01", "hospital", "Evercare Hospital Dhaka", "এভারকেয়ার হাসপাতাল ঢাকা", "ঢাকা", "ঢাকা", "বাড্ডা", "প্লট ৮১, ব্লক ই, বসুন্ধরা আ/এ", "09678-310310"),
  f("h-02", "hospital", "Square Hospital", "স্কয়ার হাসপাতাল", "ঢাকা", "ঢাকা", "ধানমণ্ডি", "১৮/এফ বীর উত্তম কাজী নুরুজ্জামান সড়ক, পান্থপথ", "09612-000000"),
  f("h-03", "hospital", "United Hospital", "ইউনাইটেড হাসপাতাল", "ঢাকা", "ঢাকা", "গুলশান", "প্লট ১৫, রোড ৭১, গুলশান", "09610-010106"),
  f("h-04", "hospital", "Asgar Ali Hospital", "আসগর আলী হাসপাতাল", "ঢাকা", "ঢাকা", "গেন্ডারিয়া", "১১১/১/এ ডিস্টিলারি রোড", "09612-221122"),
  f("h-05", "hospital", "Ibn Sina Hospital Dhanmondi", "ইবনে সিনা হাসপাতাল ধানমণ্ডি", "ঢাকা", "ঢাকা", "ধানমণ্ডি", "হাউস ৫২, রোড ২/এ, ধানমণ্ডি", "09610-010615"),
  f("h-06", "hospital", "Popular Medical College Hospital", "পপুলার মেডিকেল কলেজ হাসপাতাল", "ঢাকা", "ঢাকা", "ধানমণ্ডি", "হাউস ২২, রোড ২, ধানমণ্ডি", "09613-787801"),
  f("h-07", "hospital", "Dhaka Medical College Hospital", "ঢাকা মেডিকেল কলেজ হাসপাতাল", "ঢাকা", "ঢাকা", "চকবাজার", "১০৩ বকশীবাজার", ""),
  f("h-08", "hospital", "Enam Medical College Hospital", "এনাম মেডিকেল কলেজ হাসপাতাল", "ঢাকা", "ঢাকা", "সাভার", "৯/৩ পার্বতী নগর, থানা রোড, সাভার", "02-7744481"),
  f("d-01", "diagnostic", "Ibn Sina Diagnostic Uttara", "ইবনে সিনা ডায়াগনস্টিক উত্তরা", "ঢাকা", "ঢাকা", "উত্তরা", "হাউস ৫২, গরীবে নেওয়াজ এভিনিউ, সেক্টর ১১", "09610-010615"),
  f("d-02", "diagnostic", "Popular Diagnostic Dhanmondi", "পপুলার ডায়াগনস্টিক ধানমণ্ডি", "ঢাকা", "ঢাকা", "ধানমণ্ডি", "হাউস ২৫, রোড ২, ধানমণ্ডি", "09613-787801"),
  f("d-03", "diagnostic", "LabAid Diagnostic Gulshan", "ল্যাবএইড ডায়াগনস্টিক গুলশান", "ঢাকা", "ঢাকা", "গুলশান", "হাউস ১, রোড ৪, গুলশান ১", "10606"),
  f("d-04", "diagnostic", "Thyrocare Narayanganj", "থাইরোকেয়ার নারায়ণগঞ্জ", "ঢাকা", "নারায়ণগঞ্জ", "সদর", "বঙ্গবন্ধু রোড", ""),
  // ── Chattogram ──
  f("h-10", "hospital", "Evercare Hospital Chattogram", "এভারকেয়ার হাসপাতাল চট্টগ্রাম", "চট্টগ্রাম", "চট্টগ্রাম", "পাঁচলাইশ", "৬ এন্ড ৬/এ, ও.আর. নিজাম রোড", "09678-310310"),
  f("h-11", "hospital", "Chattogram Medical College Hospital", "চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল", "চট্টগ্রাম", "চট্টগ্রাম", "পাঁচলাইশ", "কেবি ফজলুল কাদের রোড", ""),
  f("h-12", "hospital", "Parkview Hospital", "পার্কভিউ হাসপাতাল", "চট্টগ্রাম", "চট্টগ্রাম", "পাঁচলাইশ", "৯৪/১০৩ কাতালগঞ্জ রোড", "01999-444111"),
  f("h-13", "hospital", "CSCR Hospital", "সিএসসিআর হাসপাতাল", "চট্টগ্রাম", "চট্টগ্রাম", "পাঁচলাইশ", "১৬৭৫/এ ও.আর. নিজাম রোড", "09610-007777"),
  f("d-10", "diagnostic", "Chevron Diagnostic Panchlaish", "শেভরন ডায়াগনস্টিক পাঁচলাইশ", "চট্টগ্রাম", "চট্টগ্রাম", "পাঁচলাইশ", "ও.আর. নিজাম রোড", "09638-005559"),
  f("d-11", "diagnostic", "Epic Health Care", "এপিক হেলথ কেয়ার", "চট্টগ্রাম", "চট্টগ্রাম", "পাঁচলাইশ", "১৯ কেবি ফজলুল কাদের রোড", "01979-123123"),
  f("h-14", "hospital", "Cox's Bazar Sadar Hospital", "কক্সবাজার সদর হাসপাতাল", "চট্টগ্রাম", "কক্সবাজার", "সদর", "হাসপাতাল সড়ক", ""),
  f("h-15", "hospital", "Cumilla Medical College Hospital", "কুমিল্লা মেডিকেল কলেজ হাসপাতাল", "চট্টগ্রাম", "কুমিল্লা", "সদর", "কুচাইতলি", ""),
  // ── Sylhet ──
  f("h-20", "hospital", "Sylhet MAG Osmani Medical College Hospital", "সিলেট এমএজি ওসমানী মেডিকেল কলেজ হাসপাতাল", "সিলেট", "সিলেট", "সদর", "মেডিকেল কলেজ রোড, কাজলশাহ", ""),
  f("h-21", "hospital", "Mount Adora Hospital Sylhet", "মাউন্ট আডোরা হাসপাতাল সিলেট", "সিলেট", "সিলেট", "আম্বরখানা", "৬২৯ নয়াসড়ক", "0821-722465"),
  f("h-22", "hospital", "Ibn Sina Hospital Sylhet", "ইবনে সিনা হাসপাতাল সিলেট", "সিলেট", "সিলেট", "জিন্দাবাজার", "সোবহানীঘাট", "09610-010615"),
  f("d-20", "diagnostic", "Popular Diagnostic Sylhet", "পপুলার ডায়াগনস্টিক সিলেট", "সিলেট", "সিলেট", "জিন্দাবাজার", "৬৯৩ মির্জাজাঙ্গাল", "09613-787801"),
  f("d-21", "diagnostic", "Oasis Diagnostic Moulvibazar", "ওয়েসিস ডায়াগনস্টিক মৌলভীবাজার", "সিলেট", "মৌলভীবাজার", "সদর", "এম সাইফুর রহমান রোড", ""),
  // ── Rajshahi ──
  f("h-30", "hospital", "Rajshahi Medical College Hospital", "রাজশাহী মেডিকেল কলেজ হাসপাতাল", "রাজশাহী", "রাজশাহী", "সাহেব বাজার", "লক্ষ্মীপুর", ""),
  f("h-31", "hospital", "Islami Bank Medical College Hospital Rajshahi", "ইসলামী ব্যাংক মেডিকেল কলেজ হাসপাতাল", "রাজশাহী", "রাজশাহী", "লক্ষ্মীপুর", "নওদাপাড়া", "0721-761849"),
  f("d-30", "diagnostic", "Popular Diagnostic Bogura", "পপুলার ডায়াগনস্টিক বগুড়া", "রাজশাহী", "বগুড়া", "সদর", "রংপুর রোড, ঠনঠনিয়া", "09613-787801"),
  f("h-32", "hospital", "Shaheed Ziaur Rahman Medical College Hospital", "শহীদ জিয়াউর রহমান মেডিকেল কলেজ হাসপাতাল", "রাজশাহী", "বগুড়া", "সদর", "সিলিমপুর", ""),
  f("h-33", "hospital", "Pabna Medical College Hospital", "পাবনা মেডিকেল কলেজ হাসপাতাল", "রাজশাহী", "পাবনা", "সদর", "হেমায়েতপুর", ""),
  // ── Khulna ──
  f("h-40", "hospital", "Khulna Medical College Hospital", "খুলনা মেডিকেল কলেজ হাসপাতাল", "খুলনা", "খুলনা", "সোনাডাঙ্গা", "বয়রা", ""),
  f("h-41", "hospital", "Gazi Medical College Hospital", "গাজী মেডিকেল কলেজ হাসপাতাল", "খুলনা", "খুলনা", "সোনাডাঙ্গা", "আইল্যান্ড, ময়লাপোতা মোড়", "01911-454221"),
  f("d-40", "diagnostic", "Popular Diagnostic Khulna", "পপুলার ডায়াগনস্টিক খুলনা", "খুলনা", "খুলনা", "খালিশপুর", "২৫/এ খানজাহান আলী রোড", "09613-787801"),
  f("h-42", "hospital", "Jashore Medical College Hospital", "যশোর মেডিকেল কলেজ হাসপাতাল", "খুলনা", "যশোর", "সদর", "চাঁচড়া", ""),
  f("h-43", "hospital", "Kushtia Medical College Hospital", "কুষ্টিয়া মেডিকেল কলেজ হাসপাতাল", "খুলনা", "কুষ্টিয়া", "সদর", "হাসপাতাল রোড", ""),
  // ── Barishal ──
  f("h-50", "hospital", "Sher-e-Bangla Medical College Hospital", "শের-ই-বাংলা মেডিকেল কলেজ হাসপাতাল", "বরিশাল", "বরিশাল", "সদর রোড", "দক্ষিণ আলেকান্দা", ""),
  f("h-51", "hospital", "Islami Bank Hospital Barishal", "ইসলামী ব্যাংক হাসপাতাল বরিশাল", "বরিশাল", "বরিশাল", "নথুল্লাবাদ", "চাঁদমারি", "0431-217446"),
  f("d-50", "diagnostic", "Popular Diagnostic Barishal", "পপুলার ডায়াগনস্টিক বরিশাল", "বরিশাল", "বরিশাল", "সদর রোড", "১৩৮ সদর রোড", "09613-787801"),
  f("h-52", "hospital", "Patuakhali Medical College Hospital", "পটুয়াখালী মেডিকেল কলেজ হাসপাতাল", "বরিশাল", "পটুয়াখালী", "সদর", "হাসপাতাল সড়ক", ""),
  // ── Rangpur ──
  f("h-60", "hospital", "Rangpur Medical College Hospital", "রংপুর মেডিকেল কলেজ হাসপাতাল", "রংপুর", "রংপুর", "ধাপ", "ধাপ, জেল রোড", ""),
  f("h-61", "hospital", "Prime Medical College Hospital Rangpur", "প্রাইম মেডিকেল কলেজ হাসপাতাল", "রংপুর", "রংপুর", "পীরজাবাদ", "বদরগঞ্জ রোড", "0521-621111"),
  f("d-60", "diagnostic", "Popular Diagnostic Rangpur", "পপুলার ডায়াগনস্টিক রংপুর", "রংপুর", "রংপুর", "জাহাজ কোম্পানি", "৯৮/১ জেল রোড", "09613-787801"),
  f("h-62", "hospital", "Dinajpur Medical College Hospital", "দিনাজপুর মেডিকেল কলেজ হাসপাতাল", "রংপুর", "দিনাজপুর", "সদর", "আনন্দ সাগর", ""),
  f("h-63", "hospital", "Thakurgaon General Hospital", "ঠাকুরগাঁও জেনারেল হাসপাতাল", "রংপুর", "ঠাকুরগাঁও", "সদর", "হাসপাতাল পাড়া", ""),
  // ── Mymensingh ──
  f("h-70", "hospital", "Mymensingh Medical College Hospital", "ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল", "ময়মনসিংহ", "ময়মনসিংহ", "চরপাড়া", "চরপাড়া মোড়", ""),
  f("h-71", "hospital", "Community Based Medical College Hospital", "কমিউনিটি বেজড মেডিকেল কলেজ হাসপাতাল", "ময়মনসিংহ", "ময়মনসিংহ", "সদর", "উইনারপাড়", "091-54344"),
  f("d-70", "diagnostic", "Popular Diagnostic Mymensingh", "পপুলার ডায়াগনস্টিক ময়মনসিংহ", "ময়মনসিংহ", "ময়মনসিংহ", "চরপাড়া", "৩১/এ চরপাড়া রোড", "09613-787801"),
  f("h-72", "hospital", "Jamalpur General Hospital", "জামালপুর জেনারেল হাসপাতাল", "ময়মনসিংহ", "জামালপুর", "সদর", "হাসপাতাল রোড", ""),
];

export function filterFacilities(f: {
  kind?: FacilityType;
  division?: string;
  district?: string;
  q?: string;
}): Facility[] {
  const q = (f.q ?? "").trim().toLowerCase();
  return FACILITIES.filter(
    (x) =>
      (!f.kind || x.kind === f.kind) &&
      (!f.division || x.division_bn === f.division) &&
      (!f.district || x.district_bn === f.district) &&
      (!q ||
        x.name_bn.includes(f.q!.trim()) ||
        (x.name_en ?? "").toLowerCase().includes(q) ||
        x.upazila_area.includes(f.q!.trim())),
  );
}
