export type DistrictWithAreas = {
  district: string;
  areas: string[];
};

// Starter list — expand to 64 districts later
export const DISTRICTS: DistrictWithAreas[] = [
  { district: "ঢাকা", areas: ["ধানমণ্ডি", "মিরপুর", "উত্তরা", "গুলশান", "বাড্ডা", "যাত্রাবাড়ী"] },
  { district: "চট্টগ্রাম", areas: ["পাঁচলাইশ", "আগ্রাবাদ", "হালিশহর", "জিইসি"] },
  { district: "সিলেট", areas: ["জিন্দাবাজার", "আম্বরখানা", "মিরবক্সটুলা"] },
  { district: "রাজশাহী", areas: ["সাহেব বাজার", "লক্ষ্মীপুর", "উপশহর"] },
  { district: "খুলনা", areas: ["খালিশপুর", "সোনাডাঙ্গা", "ময়লাপোতা"] },
  { district: "বরিশাল", areas: ["সদর রোড", "নথুল্লাবাদ", "রূপাতলী"] },
  { district: "রংপুর", areas: ["জাহাজ কোম্পানি", "লালবাগ", "ধাপ"] },
  { district: "ময়মনসিংহ", areas: ["গাঙ্গিনাপাড়", "চরপাড়া", "ত্রিশাল"] },
];
