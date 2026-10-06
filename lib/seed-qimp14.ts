import type { Doctor } from "@/lib/types";

// ─── Seed intake 2: QIMP-14 Doctors Directory via Scribd (extracted 2026-10-07) ───
// Source: https://www.scribd.com/doc/100525498/QIMP14-Doctors-Directory
// ("Bangladesh Doctors Directory & Contacts", 50+ doctors, Dhaka.)
// ⚠️ OLD DATA (circa 2012): clinic landlines predate the 02-XXXXXXX change and
// some 10-digit mobiles are missing a digit. EVERY phone must be re-verified
// before APPROVED. Entries with a usable 11-digit mobile show a call button;
// the rest show যাচাইাধীন. No BMDC numbers in this source → no verified badge.
// Categories in source: Physicians (= মেডিসিন, with noted exceptions below),
// Gastroenterologist/Hepatologists (= গ্যাস্ট্রোএন্টারোলজি).

export const QIMP_SOURCE_URL = "https://www.scribd.com/doc/100525498/QIMP14-Doctors-Directory";

const T = "2026-10-07T00:00:00.000Z";
const TBD = "যাচাই প্রয়োজন — অ্যাডমিন ফোনে নিশ্চিত করবেন";

function q(
  id: string,
  name_en: string,
  specialty_bn: string,
  district: string,
  area: string,
  chamber: string,
  phone: string,
): Doctor {
  return {
    id,
    name_bn: name_en, // TODO: real Bangla name on verification
    name_en,
    specialty_bn,
    bmdc_reg_no: null, // not provided in QIMP source
    location_district: district,
    location_upazila_area: area,
    chamber_address_bn: chamber,
    appointment_contact: phone,
    visiting_hours_bn: TBD,
    visiting_fee_approx: TBD,
    status: "PENDING",
    upvotes: 0,
    downvotes: 0,
    reports: 0,
    created_at: T,
  };
}

export const QIMP_DOCTORS: Doctor[] = [
  // ——— Physicians → মেডিসিন (exceptions noted inline) ———
  q("qimp-01", "Dr. A. Abdul Mottaleb", "মেডিসিন", "ঢাকা", "Elephant Road", "Badrunnessa Clinic, 77 Elephant Road / Dhaka Hospital, Mitford", ""),
  q("qimp-02", "Dr. A.A.M Mohiuddin Osmani", "মেডিসিন", "ঢাকা", "Sutrapur", "Salauddin Ash-Shifa General Hospital, 44/A Hatkhola Road, Sutrapur", "01817117703"),
  q("qimp-03", "Dr. (Maj.) Abdullah", "মেডিসিন", "ঢাকা", "Mohakhali", "Metropolitan Medical Centre, Mohakhali", ""),
  q("qimp-04", "Dr. A.B.M Abdullah", "মেডিসিন", "ঢাকা", "Green Road", "Central Physiotherapy Centre, 18 Green Road", ""),
  q("qimp-05", "Dr. A.B.M Sarwar-E-Alam", "মেডিসিন", "ঢাকা", "Panthapath", "Square Hospitals Ltd, 18/F West Panthapath", "01713141447"),
  q("qimp-06", "Dr. Abu Hena Mostofa Kmaal", "মেডিসিন", "ঢাকা", "Shantinagar", "Ahmad Diagnostic Clinic, 33 New Circular Road, Shantinagar", "01711627562"),
  q("qimp-07", "Dr. Abu Reza Mohammad Nooruzzmaan", "মেডিসিন", "ঢাকা", "Panthapath", "Square Hospitals Ltd, 18/F West Panthapath", "01713141447"),
  q("qimp-08", "Dr. A.F.M Saidur Rahman", "মেডিসিন", "ঢাকা", "Dhanmondi", "Ahmad Medical Center / Japan Bangladesh Friendship Hospital, Dhanmondi", "01715055042"),
  q("qimp-09", "Dr. Ahmedul Kabir", "মেডিসিন", "ঢাকা", "Badda", "Badda General Hospital, North Badda", ""),
  q("qimp-10", "Dr. A.K.M Aminul Hague", "মেডিসিন", "ঢাকা", "Hatirpool", "Padma General Hospital, 290 Sonargaon Road, Hatirpool", ""),
  q("qimp-11", "Dr. A.K.M Masudur Rahman", "মেডিসিন", "ঢাকা", "Kakrail", "Islami Bank Central Hospital, 30 VIP Road, Kakrail", ""),
  q("qimp-12", "Dr. Md. Abul Kalma Azad", "মেডিসিন", "ঢাকা", "Malibagh", "Padma Diagnostic Centre, 243 New Circular Road, Malibagh", "01191327971"),
  q("qimp-13", "Dr. Md. Ashraf Ali", "নিউরোলজি (স্নায়ু)", "ঢাকা", "Dhanmondi", "Ibn Sina Consultation Centre, Shankar, Satmasjid Road, Dhanmondi", "01819248933"),
  q("qimp-14", "Dr. Md. Ayub Ali Chowdhury", "কিডনি", "ঢাকা", "Dhanmondi", "Ibn Sina Diagnostic & Imaging Centre, House 48, Road 9/A, Dhanmondi", "01817144604"),
  q("qimp-15", "Dr. Md. Dabir Hossain", "মেডিসিন", "ঢাকা", "Dhanmondi", "Doctors View (Rainbow Heart), 67 Satmasjid Road, Dhanmondi", ""),
  q("qimp-16", "Dr. Md. Fazlul Kadir", "মেডিসিন", "ঢাকা", "Dhanmondi", "Medinova, House 71/A, Road 5/A, Dhanmondi", ""),
  q("qimp-17", "Dr. Md. Fazlul Haque", "মেডিসিন", "ঢাকা", "Dhanmondi", "Omar Sultan Medical Services, House 33, Road 8, Dhanmondi", ""),
  q("qimp-18", "Dr. Md. Foyezul Islam Chowdhury", "মেডিসিন", "ঢাকা", "Dhanmondi", "Medinova Medical Services, House 71/A, Road 5/A, Dhanmondi", ""),
  q("qimp-19", "Dr. Md. Liaquat Ali", "মেডিসিন", "ঢাকা", "Dhanmondi", "Ibn Sina Diagnostic & Imaging Centre, House 47, Road 9/A, Dhanmondi", ""),
  q("qimp-20", "Dr. Md. Lutful Kabir", "মেডিসিন", "ঢাকা", "Panthapath", "Medical Consultation Centre, 44/16 Panthapath", ""),
  q("qimp-21", "Dr. Md. Minhaz Rahim Choudhury", "মেডিসিন", "ঢাকা", "Dhanmondi", "Medinova Medical Services, House 71/A, Road 5/A, Dhanmondi", "01819221095"),
  q("qimp-22", "Dr. Md. Moazzem Hossain", "মেডিসিন", "ঢাকা", "Dhanmondi", "Medinova Medical Services, House 71/A, Road 5/A, Dhanmondi", "01711160103"),
  q("qimp-23", "Dr. Md. Mujibur Rahman", "মেডিসিন", "ঢাকা", "Dhanmondi", "Islamia Arogya Sadan, House 35, Road 1, Dhanmondi", "01716790289"),
  q("qimp-24", "Dr. Md. Shafiullah", "মেডিসিন", "ঢাকা", "Green Road", "Green Super Market (3rd floor)", "01819238630"),
  q("qimp-25", "Dr. Md. Shaheed Uddin Ahmad", "মেডিসিন", "ঢাকা", "Farmgate", "Al-Rajhi Hospital, Farmgate / Islami Bank Central Hospital, Kakrail", ""),
  q("qimp-26", "Dr. Md. Shaheen Choudhury", "মেডিসিন", "ঢাকা", "Green Road", "28 Green Super Market", ""),
  q("qimp-27", "Dr. Md. Tito Mian", "মেডিসিন", "ঢাকা", "Green Road", "Health and Hope Ltd, 152/1-H Green Road, Panthapath Crossing", "01819494530"),
  q("qimp-28", "Dr. Md. Ziaul Hogue", "মেডিসিন", "ঢাকা", "Dhanmondi", "Ibn Sina Consultation Centre, House 58, Road 2/A, Dhanmondi", ""),
  q("qimp-29", "Dr. Md. Zilan Miah Sarker", "মেডিসিন", "ঢাকা", "Green Road", "Comfort Tower, 167/B Green Road", ""),
  q("qimp-30", "Dr. Mirza Nazim Uddin", "মেডিসিন", "ঢাকা", "Panthapath", "Square Hospitals Ltd, 18/F West Panthapath", "01713141447"),
  q("qimp-31", "Dr. M. Jalaluddin", "মেডিসিন", "ঢাকা", "Dhanmondi", "Lab Aid Cardiac Hospital, House 1, Road 4, Dhanmondi", "01716585828"),
  q("qimp-32", "Dr. M.M.A Bari", "মেডিসিন", "ঢাকা", "Dhanmondi", "Central Hospital, House 2, Road 5, Green Road, Dhanmondi", ""),
  q("qimp-33", "Dr. M.N Alam", "মেডিসিন", "ঢাকা", "Dhanmondi", "Harun Eye Foundation & Green Hospital, House 12A, Road 5, Dhanmondi", ""),
  q("qimp-34", "Dr. Mohammad Azizul Kahhar", "মেডিসিন", "ঢাকা", "Dhanmondi", "Modern Diagnostic Centre, House 14, Road 7, Dhanmondi", ""),
  q("qimp-35", "Dr. Mohammad Hyder Ali", "মেডিসিন", "ঢাকা", "Lalmatia", "City Hospital, 1/8 Block-E, Lalmatia, Satmasjid Road", "01715024100"),
  q("qimp-36", "Dr. Mostafizur Rahman", "মেডিসিন", "ঢাকা", "Fakirapool", "Modern Diagnostic Centre, 194/2 Fakirapool", ""),
  q("qimp-37", "Dr. (Major-Rtd) Mujibur Rahman", "মেডিসিন", "ঢাকা", "Dhanmondi", "Anwer Khan Modern Hospital, House 17, Road 8, Dhanmondi", ""),
  q("qimp-38", "Dr. Munir Uddin Ahmed", "মেডিসিন", "ঢাকা", "Dhanmondi", "Lab Aid Ltd, House 1, Road 4, Dhanmondi", ""),
  q("qimp-39", "Dr. Niaz Ahmed Khan", "মেডিসিন", "ঢাকা", "Dhanmondi", "Medinova, House 71/A, Road 5/A, Dhanmondi", ""),
  q("qimp-40", "Dr. NI Khan", "মেডিসিন", "ঢাকা", "Malibagh", "Lab Aid Ltd / Lab Aid Unit-2, Siddiswari Road, Malibagh", ""),
  q("qimp-41", "Dr. Nikhat Shahela Afsar", "মেডিসিন", "ঢাকা", "Uttara", "Uttara Crescent Hospital, Sector-3, Rabindra Sarani, Uttara", "01714040695"),
  q("qimp-42", "Dr. Nurul Islam (MRCP UK)", "মেডিসিন", "ঢাকা", "Dhanmondi", "Popular Diagnostic Centre, House 11/A, Road 2, Dhanmondi", ""),
  q("qimp-43", "Dr. Nurul Islam (National Professor)", "মেডিসিন", "ঢাকা", "Central Road", "Gulmeher, 63 Central Road", ""),
  q("qimp-44", "Dr. Q Tarikul Islam", "মেডিসিন", "ঢাকা", "Dhanmondi", "Popular Diagnostic Centre, House 11/A, Road 2, Dhanmondi", "01816647835"),
  q("qimp-45", "Dr. Rajibul Alam", "মেডিসিন", "ঢাকা", "Eskaton", "Udayan Poly Clinic, New Eskaton Road", ""),
  q("qimp-46", "Dr. Rashimul Haque (Rimon)", "মেডিসিন", "ঢাকা", "Uttara", "Lubana General Hospital, Sector-7, Rabindra Sarani, Uttara", "01715123416"),
  q("qimp-47", "Dr. (Maj) Shaila Parveen", "মেডিসিন", "ঢাকা", "Green Road", "Central Hospital, House 2, Road 5, Green Road, Dhanmondi", "01819294922"),
  q("qimp-48", "Dr. Sirajul Islam", "কিডনি", "ঢাকা", "Green Road", "Kidney & Urology Hospital, Fattah Plaza, 70 Green Road", "01711525421"),
  q("qimp-49", "Dr. S.M. Hossain (Sadee)", "হৃদরোগ", "ঢাকা", "Kakrail", "Islami Bank Central Hospital, 30 VIP Road, Kakrail", ""),
  q("qimp-50", "Dr. S.M.K Hassan (Mahmud)", "মেডিসিন", "ঢাকা", "Dhanmondi", "Modern Diagnostic Centre, House 8, Road 7, Dhanmondi", "01711537039"),
  q("qimp-51", "Dr. Taimur A.K Mahmud", "মেডিসিন", "ঢাকা", "Green Road", "Comfort Doctor's Chamber, 64/1 Green Road", ""),
  q("qimp-52", "Dr. Tofail Ahmed", "মেডিসিন", "ঢাকা", "Kakrail", "Islami Bank Central Hospital, 30 VIP Road, Kakrail", "01711349894"),
  q("qimp-53", "Dr. Wali Ullah", "মেডিসিন", "ঢাকা", "Green Road", "Millennium Diagnostic Centre, 146/3 Green Road", ""),
  q("qimp-54", "Dr. Wasim Md. Mohosinul Haque", "মেডিসিন", "ঢাকা", "Lalmatia", "City Hospital, 1/8 Block-E, Lalmatia, Satmasjid Road", "01815484600"),
  q("qimp-55", "Dr. Ziaul Huq", "মেডিসিন", "ঢাকা", "Panthapath", "Square Hospitals Ltd, 18/F West Panthapath", "01713141447"),
  q("qimp-56", "Dr. M.S Arfin", "মেডিসিন", "ঢাকা", "Panthapath", "Square Hospitals Ltd, 18/F West Panthapath", "01713141447"),
  // ——— Gastroenterologist / Hepatologists → গ্যাস্ট্রোএন্টারোলজি ———
  q("qimp-57", "Dr. Abdullah Al-Safee Majumdar", "গ্যাস্ট্রোএন্টারোলজি", "ঢাকা", "Dhanmondi", "Popular Consultation Centre, House 9/A, Road 2, Dhanmondi", ""),
  q("qimp-58", "Dr. A.H.M Rowshon", "গ্যাস্ট্রোএন্টারোলজি", "ঢাকা", "Dhanmondi", "Naz-E-Noor Hospital, House 69, Road 9/A, Dhanmondi", ""),
  q("qimp-59", "Dr. A. K. Azad Khan", "গ্যাস্ট্রোএন্টারোলজি", "ঢাকা", "Segunbagicha", "10/A Segunbagicha, Naya Paltan / House 42, Road 1/A, Banani", ""),
  q("qimp-60", "Dr. A K M Khorshed Alam", "গ্যাস্ট্রোএন্টারোলজি", "ঢাকা", "Farmgate", "Al-Rajhi Hospital, 12 Farmgate", ""),
  q("qimp-61", "Dr. A. Q. M Mohsen", "গ্যাস্ট্রোএন্টারোলজি", "ঢাকা", "Green Road", "Gastro Liver Hospital & Research Institute, 69/D Green Road, Panthapath", "01817049278"),
  q("qimp-62", "Dr. A.S.M.A Raihan", "গ্যাস্ট্রোএন্টারোলজি", "ঢাকা", "Dhanmondi", "Popular Consultation Centre, House 9, Road 2, Dhanmondi", ""),
];

export function filterQimp(f: { district?: string; area?: string; specialty?: string }): Doctor[] {
  return QIMP_DOCTORS.filter(
    (d) =>
      (!f.district || d.location_district === f.district) &&
      (!f.area || d.location_upazila_area === f.area) &&
      (!f.specialty || d.specialty_bn === f.specialty),
  );
}

export function findQimp(id: string): Doctor | undefined {
  return QIMP_DOCTORS.find((d) => d.id === id);
}
