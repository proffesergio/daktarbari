export type DistrictInfo = {
  name_bn: string;
  name_en: string;
  upazilas: string[];
};

export type DivisionInfo = {
  name_bn: string;
  name_en: string;
  districts: DistrictInfo[];
};

// Full 8 divisions / 64 districts. Upazilas = major + Sadar (expandable).
// Bengali names are official; English for search/slug.
export const DIVISIONS: DivisionInfo[] = [
  {
    name_bn: "ঢাকা",
    name_en: "Dhaka",
    districts: [
      { name_bn: "ঢাকা", name_en: "Dhaka", upazilas: ["ধানমণ্ডি", "মিরপুর", "উত্তরা", "গুলশান", "বাড্ডা", "যাত্রাবাড়ী", "সাভার", "কেরানীগঞ্জ", "ধামরাই", "দোহার"] },
      { name_bn: "গাজীপুর", name_en: "Gazipur", upazilas: ["সদর", "কালিয়াকৈর", "শ্রীপুর", "কাপাসিয়া", "কালীগঞ্জ"] },
      { name_bn: "কিশোরগঞ্জ", name_en: "Kishoreganj", upazilas: ["সদর", "ভৈরব", "বাজিতপুর", "কটিয়াদী", "পাকুন্দিয়া"] },
      { name_bn: "মানিকগঞ্জ", name_en: "Manikganj", upazilas: ["সদর", "সিংগাইর", "সাটুরিয়া", "ঘিওর", "শিবালয়"] },
      { name_bn: "মুন্সিগঞ্জ", name_en: "Munshiganj", upazilas: ["সদর", "শ্রীনগর", "সিরাজদিখান", "লৌহজং", "গজারিয়া"] },
      { name_bn: "নরসিংদী", name_en: "Narsingdi", upazilas: ["সদর", "পলাশ", "শিবপুর", "রায়পুরা", "বেলাবো"] },
      { name_bn: "নারায়ণগঞ্জ", name_en: "Narayanganj", upazilas: ["সদর", "বন্দর", "রূপগঞ্জ", "সোনারগাঁ", "আড়াইহাজার"] },
      { name_bn: "টাঙ্গাইল", name_en: "Tangail", upazilas: ["সদর", "মির্জাপুর", "কালিহাতী", "ঘাটাইল", "মধুপুর"] },
      { name_bn: "ফরিদপুর", name_en: "Faridpur", upazilas: ["সদর", "ভাঙ্গা", "বোয়ালমারী", "মধুখালী", "আলফাডাঙ্গা"] },
      { name_bn: "গোপালগঞ্জ", name_en: "Gopalganj", upazilas: ["সদর", "টুঙ্গিপাড়া", "কোটালীপাড়া", "মুকসুদপুর", "কাশিয়ানী"] },
      { name_bn: "মাদারীপুর", name_en: "Madaripur", upazilas: ["সদর", "শিবচর", "রাজৈর", "কালকিনি"] },
      { name_bn: "রাজবাড়ী", name_en: "Rajbari", upazilas: ["সদর", "গোয়ালন্দ", "পাংশা", "বালিয়াকান্দি"] },
      { name_bn: "শরীয়তপুর", name_en: "Shariatpur", upazilas: ["সদর", "নড়িয়া", "ভেদরগঞ্জ", "ডামুড্যা", "জাজিরা"] },
    ],
  },
  {
    name_bn: "চট্টগ্রাম",
    name_en: "Chattogram",
    districts: [
      { name_bn: "চট্টগ্রাম", name_en: "Chattogram", upazilas: ["পাঁচলাইশ", "আগ্রাবাদ", "হালিশহর", "জিইসি", "পটিয়া", "সীতাকুণ্ড", "মিরসরাই", "হাটহাজারী"] },
      { name_bn: "বান্দরবান", name_en: "Bandarban", upazilas: ["সদর", "রুমা", "থানচি", "লামা", "আলীকদম"] },
      { name_bn: "ব্রাহ্মণবাড়িয়া", name_en: "Brahmanbaria", upazilas: ["সদর", "আশুগঞ্জ", "নবীনগর", "সরাইল", "আখাউড়া"] },
      { name_bn: "চাঁদপুর", name_en: "Chandpur", upazilas: ["সদর", "হাজীগঞ্জ", "মতলব", "শাহরাস্তি", "কচুয়া"] },
      { name_bn: "কুমিল্লা", name_en: "Cumilla", upazilas: ["সদর", "চান্দিনা", "দাউদকান্দি", "লাকসাম", "চৌদ্দগ্রাম"] },
      { name_bn: "কক্সবাজার", name_en: "Cox's Bazar", upazilas: ["সদর", "টেকনাফ", "উখিয়া", "চকরিয়া", "মহেশখালী"] },
      { name_bn: "ফেনী", name_en: "Feni", upazilas: ["সদর", "ছাগলনাইয়া", "দাগনভূঞা", "পরশুরাম", "সোনাগাজী"] },
      { name_bn: "খাগড়াছড়ি", name_en: "Khagrachari", upazilas: ["সদর", "দীঘিনালা", "পানছড়ি", "মাটিরাঙ্গা"] },
      { name_bn: "লক্ষ্মীপুর", name_en: "Lakshmipur", upazilas: ["সদর", "রামগঞ্জ", "রায়পুর", "রামগতি"] },
      { name_bn: "নোয়াখালী", name_en: "Noakhali", upazilas: ["সদর", "বেগমগঞ্জ", "চাটখিল", "সেনবাগ", "হাতিয়া"] },
      { name_bn: "রাঙ্গামাটি", name_en: "Rangamati", upazilas: ["সদর", "কাপ্তাই", "বাঘাইছড়ি", "লংগদু"] },
    ],
  },
  {
    name_bn: "সিলেট",
    name_en: "Sylhet",
    districts: [
      { name_bn: "সিলেট", name_en: "Sylhet", upazilas: ["জিন্দাবাজার", "আম্বরখানা", "মিরবক্সটুলা", "সদর", "বিশ্বনাথ", "গোলাপগঞ্জ", "বিয়ানীবাজার"] },
      { name_bn: "মৌলভীবাজার", name_en: "Moulvibazar", upazilas: ["সদর", "শ্রীমঙ্গল", "কুলাউড়া", "বড়লেখা", "কমলগঞ্জ"] },
      { name_bn: "হবিগঞ্জ", name_en: "Habiganj", upazilas: ["সদর", "মাধবপুর", "চুনারুঘাট", "বানিয়াচং", "নবীগঞ্জ"] },
      { name_bn: "সুনামগঞ্জ", name_en: "Sunamganj", upazilas: ["সদর", "ছাতক", "জগন্নাথপুর", "দিরাই", "তাহিরপুর"] },
    ],
  },
  {
    name_bn: "রাজশাহী",
    name_en: "Rajshahi",
    districts: [
      { name_bn: "রাজশাহী", name_en: "Rajshahi", upazilas: ["সাহেব বাজার", "লক্ষ্মীপুর", "উপশহর", "পবা", "মোহনপুর", "তানোর"] },
      { name_bn: "বগুড়া", name_en: "Bogura", upazilas: ["সদর", "শেরপুর", "ধুনট", "আদমদীঘি", "শাজাহানপুর"] },
      { name_bn: "জয়পুরহাট", name_en: "Joypurhat", upazilas: ["সদর", "পাঁচবিবি", "কালাই", "ক্ষেতলাল"] },
      { name_bn: "নওগাঁ", name_en: "Naogaon", upazilas: ["সদর", "মহাদেবপুর", "পত্নীতলা", "নিয়ামতপুর"] },
      { name_bn: "নাটোর", name_en: "Natore", upazilas: ["সদর", "সিংড়া", "বড়াইগ্রাম", "লালপুর"] },
      { name_bn: "চাঁপাইনবাবগঞ্জ", name_en: "Chapai Nawabganj", upazilas: ["সদর", "শিবগঞ্জ", "গোমস্তাপুর", "নাচোল"] },
      { name_bn: "পাবনা", name_en: "Pabna", upazilas: ["সদর", "ঈশ্বরদী", "ভাঙ্গুড়া", "সুজানগর", "বেড়া"] },
      { name_bn: "সিরাজগঞ্জ", name_en: "Sirajganj", upazilas: ["সদর", "শাহজাদপুর", "উল্লাপাড়া", "বেলকুচি", "কাজিপুর"] },
    ],
  },
  {
    name_bn: "খুলনা",
    name_en: "Khulna",
    districts: [
      { name_bn: "খুলনা", name_en: "Khulna", upazilas: ["খালিশপুর", "সোনাডাঙ্গা", "ময়লাপোতা", "দৌলতপুর", "পাইকগাছা", "ডুমুরিয়া"] },
      { name_bn: "বাগেরহাট", name_en: "Bagerhat", upazilas: ["সদর", "মোংলা", "মোরেলগঞ্জ", "চিতলমারী"] },
      { name_bn: "চুয়াডাঙ্গা", name_en: "Chuadanga", upazilas: ["সদর", "আলমডাঙ্গা", "দামুড়হুদা", "জীবননগর"] },
      { name_bn: "যশোর", name_en: "Jashore", upazilas: ["সদর", "অভয়নগর", "কেশবপুর", "ঝিকরগাছা", "মনিরামপুর"] },
      { name_bn: "ঝিনাইদহ", name_en: "Jhenaidah", upazilas: ["সদর", "কালীগঞ্জ", "কোটচাঁদপুর", "শৈলকুপা"] },
      { name_bn: "কুষ্টিয়া", name_en: "Kushtia", upazilas: ["সদর", "ভেড়ামারা", "কুমারখালী", "মিরপুর"] },
      { name_bn: "মাগুরা", name_en: "Magura", upazilas: ["সদর", "শ্রীপুর", "মহম্মদপুর", "শালিখা"] },
      { name_bn: "মেহেরপুর", name_en: "Meherpur", upazilas: ["সদর", "গাংনী", "মুজিবনগর"] },
      { name_bn: "নড়াইল", name_en: "Narail", upazilas: ["সদর", "লোহাগড়া", "কালিয়া"] },
      { name_bn: "সাতক্ষীরা", name_en: "Satkhira", upazilas: ["সদর", "কলারোয়া", "তালা", "শ্যামনগর"] },
    ],
  },
  {
    name_bn: "বরিশাল",
    name_en: "Barishal",
    districts: [
      { name_bn: "বরিশাল", name_en: "Barishal", upazilas: ["সদর রোড", "নথুল্লাবাদ", "রূপাতলী", "মুলাদী", "বাকেরগঞ্জ", "উজিরপুর"] },
      { name_bn: "বরগুনা", name_en: "Barguna", upazilas: ["সদর", "আমতলী", "পাথরঘাটা", "বেতাগী"] },
      { name_bn: "ভোলা", name_en: "Bhola", upazilas: ["সদর", "চরফ্যাশন", "লালমোহন", "বোরহানউদ্দিন"] },
      { name_bn: "ঝালকাঠি", name_en: "Jhalokati", upazilas: ["সদর", "নলছিটি", "রাজাপুর", "কাঁঠালিয়া"] },
      { name_bn: "পটুয়াখালী", name_en: "Patuakhali", upazilas: ["সদর", "কলাপাড়া", "গলাচিপা", "বাউফল"] },
      { name_bn: "পিরোজপুর", name_en: "Pirojpur", upazilas: ["সদর", "মঠবাড়িয়া", "নেছারাবাদ", "ভান্ডারিয়া"] },
    ],
  },
  {
    name_bn: "রংপুর",
    name_en: "Rangpur",
    districts: [
      { name_bn: "রংপুর", name_en: "Rangpur", upazilas: ["জাহাজ কোম্পানি", "লালবাগ", "ধাপ", "সদর", "পীরগঞ্জ", "মিঠাপুকুর"] },
      { name_bn: "দিনাজপুর", name_en: "Dinajpur", upazilas: ["সদর", "বিরামপুর", "পার্বতীপুর", "ফুলবাড়ী", "বিরল"] },
      { name_bn: "গাইবান্ধা", name_en: "Gaibandha", upazilas: ["সদর", "গোবিন্দগঞ্জ", "পলাশবাড়ী", "সুন্দরগঞ্জ"] },
      { name_bn: "কুড়িগ্রাম", name_en: "Kurigram", upazilas: ["সদর", "উলিপুর", "নাগেশ্বরী", "ভূরুঙ্গামারী"] },
      { name_bn: "লালমনিরহাট", name_en: "Lalmonirhat", upazilas: ["সদর", "পাটগ্রাম", "হাতীবান্ধা", "কালীগঞ্জ"] },
      { name_bn: "নীলফামারী", name_en: "Nilphamari", upazilas: ["সদর", "সৈয়দপুর", "ডোমার", "জলঢাকা"] },
      { name_bn: "পঞ্চগড়", name_en: "Panchagarh", upazilas: ["সদর", "তেঁতুলিয়া", "বোদা", "দেবীগঞ্জ"] },
      { name_bn: "ঠাকুরগাঁও", name_en: "Thakurgaon", upazilas: ["সদর", "পীরগঞ্জ", "রাণীশংকৈল", "বালিয়াডাঙ্গী"] },
    ],
  },
  {
    name_bn: "ময়মনসিংহ",
    name_en: "Mymensingh",
    districts: [
      { name_bn: "ময়মনসিংহ", name_en: "Mymensingh", upazilas: ["গাঙ্গিনাপাড়", "চরপাড়া", "ত্রিশাল", "সদর", "ভালুকা", "ফুলপুর"] },
      { name_bn: "জামালপুর", name_en: "Jamalpur", upazilas: ["সদর", "ইসলামপুর", "মেলান্দহ", "সরিষাবাড়ী", "দেওয়ানগঞ্জ"] },
      { name_bn: "নেত্রকোণা", name_en: "Netrokona", upazilas: ["সদর", "মোহনগঞ্জ", "দুর্গাপুর", "কেন্দুয়া"] },
      { name_bn: "শেরপুর", name_en: "Sherpur", upazilas: ["সদর", "নালিতাবাড়ী", "শ্রীবরদী", "নকলা"] },
    ],
  },
];

export function getDistricts(divisionBn: string): DistrictInfo[] {
  return DIVISIONS.find((d) => d.name_bn === divisionBn)?.districts ?? [];
}

export function getUpazilas(divisionBn: string, districtBn: string): string[] {
  return getDistricts(divisionBn).find((d) => d.name_bn === districtBn)?.upazilas ?? [];
}

export function findDivisionByDistrict(districtBn: string): string {
  for (const div of DIVISIONS) {
    if (div.districts.some((d) => d.name_bn === districtBn)) return div.name_bn;
  }
  return "";
}

export const ALL_DISTRICTS_FLAT: string[] = DIVISIONS.flatMap((d) =>
  d.districts.map((x) => x.name_bn),
);
