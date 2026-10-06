import type { Doctor } from "@/lib/types";

// ─── Seed intake: bddoctorsdirectory.com/featured-doctors (fetched 2026-10-07) ───
// FACTS ONLY (name, specialty, hospital, BMDC, experience). Biographies and
// photos were NOT copied. Chamber phone/hours/fee verified ONLY where marked
// "verified" below (2 profiles opened). Everything else is status PENDING and
// must be phone-verified by admin before APPROVED. Bangla names are pending
// manual entry — name_bn currently holds the English name.
// Source profile URL pattern: https://bddoctorsdirectory.com/doctor/<slug>

const T = "2026-10-07T00:00:00.000Z";
const TBD = "যাচাই প্রয়োজন — অ্যাডমিন ফোনে নিশ্চিত করবেন";

function seed(
  id: string,
  name_en: string,
  specialty_bn: string,
  bmdc_reg_no: string | null,
  district: string,
  area: string,
  chamber: string,
  phone: string,
  hours: string,
  fee: string,
  _slug: string,
): Doctor {
  void _slug; // slug registry lives in SEED_SOURCES below; param keeps call-sites self-documenting
  return {
    id,
    name_bn: name_en, // TODO: picks up real Bangla name on verification
    name_en,
    specialty_bn,
    bmdc_reg_no,
    location_district: district,
    location_upazila_area: area,
    chamber_address_bn: chamber,
    appointment_contact: phone,
    visiting_hours_bn: hours,
    visiting_fee_approx: fee,
    status: "PENDING",
    upvotes: 0,
    downvotes: 0,
    reports: 0,
    created_at: T,
  };
}

export const SEED_SOURCES: Record<string, string> = {};
function reg(id: string, slug: string) {
  SEED_SOURCES[id] = `https://bddoctorsdirectory.com/doctor/${slug}`;
}

// Profile photos live in /public/doctors (downloaded once, served by us).
// QIMP entries have no photos and fall back to initials.
const SEED_PHOTOS: Record<string, string> = {
  "seed-01": "file-1789387301178-778420540.jpg",
  "seed-02": "file-1783926282491-162031228.jpg",
  "seed-03": "file-1790848897868-831642684.jpg",
  "seed-04": "image-1767347229767-633110644.jpg",
  "seed-05": "image-1767347164822-916690446.jpg",
  "seed-06": "image-1767346873912-673512584.jpg",
  "seed-07": "file-1788934377078-337578205.jpg",
  "seed-08": "image-1767344793746-953321986.jpg",
  "seed-09": "image-1767344680464-992160989.jpg",
  "seed-10": "file-1789379000663-249278241.jpg",
  "seed-11": "image-1767347468444-238771650.jpg",
  "seed-12": "image-1767347079070-556412351.jpg",
  "seed-13": "image-1767347016602-862437350.jpg",
  "seed-14": "image-1767344274716-236222220.jpg",
  "seed-15": "file-1789386602774-618419669.jpg",
  "seed-16": "file-1777875982272-682402789.jpg",
  "seed-17": "file-1787202425495-980792322.jpg",
  "seed-18": "image-1767344569449-141607059.jpg",
  "seed-19": "image-1767344729584-509903822.jpg",
  "seed-20": "image-1767344622987-863925229.jpg",
  "seed-21": "image-1767346986551-865673681.jpg",
  "seed-22": "file-1789541556972-426070325.jpg",
  "seed-23": "image-1767344343570-991186761.jpg",
  "seed-24": "file-1784020356920-449135969.jpg",
  "seed-25": "image-1767344029646-879954255.jpg",
  "seed-26": "image-1767343711526-258181653.jpg",
  "seed-27": "image-1767344647769-765204398.jpg",
  "seed-28": "file-1788933175094-423506379.jpg",
  "seed-29": "file-1780576879002-37391386.jpg",
  "seed-30": "file-1791184023938-642928519.jpg",
  "seed-31": "image-1767347110413-786332017.jpg",
  "seed-32": "file-1785325977647-129514331.jpg",
  "seed-33": "file-1786004491496-293605182.jpg",
};

const PHOTO_BASE = "/doctors/";

function withPhoto(d: Doctor): Doctor {
  const f = SEED_PHOTOS[d.id];
  return f ? { ...d, photo_url: PHOTO_BASE + f } : d;
}

// Specialty EN → BN used for this intake:
// Neurosurgery→নিউরোসার্জারি, Plastic & Aesthetic Surgery→প্লাস্টিক সার্জারি,
// Oral & Maxillofacial Surgery→ডেন্টাল (দাঁত), Colorectal Surgery→কোলোরেক্টাল সার্জারি,
// Cardiac Surgery→কার্ডিয়াক সার্জারি, Orthopedic Surgery→অর্থোপেডিক (হাড়),
// Eye Specialist→চক্ষু, Dentist→ডেন্টাল (দাঁত), Cardiologist→হৃদরোগ,
// Pediatric Specialist→শিশু রোগ, Gastroenterology→গ্যাস্ট্রোএন্টারোলজি,
// Reproductive Endocrinology & Infertility→গাইনি ও প্রসূতি, Urologist→ইউরোলজি,
// Pediatric Urology & Surgery→শিশু রোগ

export const SEED_DOCTORS: Doctor[] = [
  // ——— VERIFIED (profile opened: 2 chambers, phone, hours, fee) ———
  seed("seed-01", "Prof. Dr. Md. Shafiqul Islam", "নিউরোসার্জারি", "A-22578", "ঢাকা", "উত্তরা", "HI-Care General Hospital, House 24 & 26, Lake Drive Road, Sector 7, Uttara (২য় চেম্বার: Popular Medical College Hospital, Dhanmondi)", "01844177571", "রবি, মঙ্গল, বৃহস্পতি (বিকেল ৪টা-রাত ৯টা); শনি, সোম, বুধ (বিকেল ৪টা-৭টা, ধানমণ্ডি)", "১৫০০ টাকা", "professor-dr-md-shafiqul-islam"),
  seed("seed-18", "Dr. S Chakrabarty", "হৃদরোগ", "A-32276", "ঢাকা", "মিরপুর", "Delta Hospital, Mirpur 1 (৮ম তলা, রুম ৮০০১) (২য় চেম্বার: Modern Hospital, Shaktola, Cumilla)", "01750623246", "শনি, রবি, মঙ্গল-বৃহস্পতি (সকাল ১০টা-সন্ধ্যা ৬টা)", "১০০০ টাকা", "dr-s-chakrabarty"),
  // ——— LISTING-LEVEL (hospital + BMDC from directory cards; phone/hours TBD) ———
  seed("seed-02", "Professor Dr. Sayeed Ahmed Siddiky", "প্লাস্টিক সার্জারি", "A-10762", "ঢাকা", "ঢাকা", "Plastic and Aesthetic Surgery (Professor)", "", TBD, TBD, "professor-dr-sayeed-ahmed-siddiky"),
  seed("seed-03", "Prof. Dr. Nasir Uddin", "ডেন্টাল (দাঁত)", "475", "ঢাকা", "ঢাকা", "Sapporo Dental College & Hospital / LabAid Cancer Hospital", "", TBD, TBD, "prof-dr-nasir-uddin"),
  seed("seed-04", "Dr. Golam Mustafa", "কোলোরেক্টাল সার্জারি", "A-40792", "ঢাকা", "ঢাকা", "Dhaka Medical College (Assistant Professor, Colorectal Surgery)", "", TBD, TBD, "dr-golam-mustafa"),
  seed("seed-05", "Professor Dr. Md. Abdul Wohab Khan", "কোলোরেক্টাল সার্জারি", "A-15918", "ঢাকা", "ঢাকা", "Bangladesh Medical University, Department of Surgery (Professor)", "", TBD, TBD, "professor-dr-md-abdul-wohab-khan"),
  seed("seed-06", "Professor Dr. Istiaq Ahmed Dipu", "কার্ডিয়াক সার্জারি", "A-29076", "ঢাকা", "ঢাকা", "Dhaka Medical College Hospital, Dept. of Cardiac Surgery (Professor & Head)", "", TBD, TBD, "professor-dr-istiaq-ahmed-dipu"),
  seed("seed-07", "Dr. Chowdhury Rashedul Mughni", "প্লাস্টিক সার্জারি", "A-41174", "ঢাকা", "ধানমণ্ডি", "Ekagra Health, Dhanmondi (Director Medical Services, Burn & Plastic Surgery)", "", TBD, TBD, "dr-chowdhury-rashedul-mughni"),
  seed("seed-08", "Dr. Md. Alamgir Hossain Jony", "অর্থোপেডিক (হাড়)", "A-32769", "ঢাকা", "শেরে বাংলা নগর", "National Institute of Orthopaedic Hospital and Rehabilitation (NITOR)", "", TBD, TBD, "dr-md-alamgir-hossain-jony"),
  seed("seed-09", "Prof. Dr. Mohammad Nashir Uddin", "প্লাস্টিক সার্জারি", "A-23801", "ঢাকা", "ঢাকা", "National Institute of Burn and Plastic Surgery (Director) / AMZ Hospital", "", TBD, TBD, "dr-nashir-uddin"),
  seed("seed-10", "Dr. M M Hasan Shiplu", "নিউরোসার্জারি", "A-36364", "ঢাকা", "ঢাকা", "Dhaka Medical College Hospital (Associate Professor, Neurosurgery)", "", TBD, TBD, "dr-m-m-hasan-shiplu"),
  seed("seed-11", "Professor Dr. Md. Zahid Raihan", "নিউরোসার্জারি", "A-23247", "ঢাকা", "ঢাকা", "Directorate General of Health Services (Additional Director General, Admin)", "", TBD, TBD, "professor-dr-md-zahid-raihan"),
  seed("seed-12", "Dr. A F M Ariful Islam Nobin", "প্লাস্টিক সার্জারি", "A-34625", "ঢাকা", "ঢাকা", "Plastic and Aesthetic Surgeon", "", TBD, TBD, "dr-a-kh-m-ariful-islam-nobin"),
  seed("seed-13", "Dr. Md. Emranul Islam Abir", "চক্ষু", "A-39559", "খুলনা", "খুলনা", "Khulna Medical College, Dept. of Ophthalmology (Associate Professor & Head)", "", TBD, TBD, "dr-md-emranul-islam-abir"),
  seed("seed-14", "Dr. Sumit Ranjan Basak", "ডেন্টাল (দাঁত)", "2832", "ঢাকা", "ঢাকা", "Specialist Dental Surgeon & Orthodontist", "", TBD, TBD, "dr-sumit-ranjan-basak"),
  seed("seed-15", "Prof. Dr. A. F. M. Momtazul Haque", "নিউরোসার্জারি", "A-32045", "ঢাকা", "ঢাকা", "Dhaka Medical College & Hospital (Professor & Unit Head, Neurosurgery)", "", TBD, TBD, "prof-dr-a-f-m-momtazul-haque"),
  seed("seed-16", "Professor Dr. Md. Abdul Quader", "অর্থোপেডিক (হাড়)", "A-11238", "ঢাকা", "ঢাকা", "Orthopaedic Professor (Osteoarthritis, Trauma, Spine Specialist & Surgeon)", "", TBD, TBD, "professor-dr-md-abdul-quader"),
  seed("seed-17", "Dr. Ishtiaq Alam", "কোলোরেক্টাল সার্জারি", "A-37370", "সিলেট", "সিলেট", "Sylhet MAG Osmani Medical College (Associate Professor, Colorectal Surgery)", "", TBD, TBD, "dr-ishtiaq-alam"),
  seed("seed-19", "Dr. Monzurul Karim", "শিশু রোগ", "A-39843", "ঢাকা", "যাত্রাবাড়ী", "Institute of Child & Mother Health (ICMH), Matuail (Assistant Professor, Pediatrics)", "", TBD, TBD, "dr-monzurul-karim"),
  seed("seed-20", "Dr. Md. Rustom Ali Modhu", "নিউরোসার্জারি", "A-25814", "ঢাকা", "ঢাকা", "Brain and Spine Surgeon", "", TBD, TBD, "dr-md-rustam-ali-madhu"),
  seed("seed-21", "Dr. Farhad Hossain Md. Shahed", "গ্যাস্ট্রোএন্টারোলজি", "A-26972", "ঢাকা", "ঢাকা", "Gastroliver Specialist", "", TBD, TBD, "dr-farhad-hossain-md-shahed"),
  seed("seed-22", "Dr. M H Pannu", "কোলোরেক্টাল সার্জারি", "A-45501", "ঢাকা", "ঢাকা", "Colorectal & Laparoscopic Surgeon", "", TBD, TBD, "dr-m-h-pannu"),
  seed("seed-23", "Dr. Sharmin Afroz", "গাইনি ও প্রসূতি", "43934", "ঢাকা", "ঢাকা", "Infertility, Laparoscopic, Gynae & Obs Specialist", "", TBD, TBD, "dr-sharmin-afroz"),
  seed("seed-24", "Prof. Dr. Bijoy Krishna Das", "প্লাস্টিক সার্জারি", "A-16886", "ঢাকা", "বাড্ডা", "Evercare Hospital Dhaka (Senior Consultant, Pediatric & Adolescent Surgery)", "", TBD, TBD, "prof-dr-bijoy-krishna-das"),
  seed("seed-25", "Dr. Md. Sayeef Ullah Sujan", "ইউরোলজি", "A-65257", "ঢাকা", "ঢাকা", "Kidney & Urology Care (Associate Professor & Head, Urology)", "", TBD, TBD, "dr-md-sayeef-ullah-sujan"),
  seed("seed-26", "Dr. Mohammad Yousuf Ali", "প্লাস্টিক সার্জারি", "A-48305", "রাজশাহী", "রাজশাহী", "Rajshahi Medical College Hospital, Dept. of Burn and Plastic Surgery (Assistant Professor)", "", TBD, TBD, "drmohammad-yousuf-ali"),
  seed("seed-27", "Dr. Md. Akter Kamal Perveg", "ইউরোলজি", "A-37201", "ঢাকা", "ঢাকা", "Urologist & Kidney Transplant Surgeon", "", TBD, TBD, "dr-md-akter-kamal-perveg"),
  seed("seed-28", "Dr. Kh. Nafiz Rahman", "অর্থোপেডিক (হাড়)", "A-56244", "ঢাকা", "শেরে বাংলা নগর", "National Institute of Traumatology & Orthopedic Rehabilitation, NITOR (Assistant Professor)", "", TBD, TBD, "dr-nafiz-rahman"),
  seed("seed-29", "Dr. Md. Mahfujullha", "চক্ষু", "A-38747", "ঢাকা", "ঢাকা", "Assistant Professor, Ophthalmology (Phaco & Oculoplasty)", "", TBD, TBD, "dr-md-mahfujullha"),
  seed("seed-30", "Dr. Md. Tauhidur Rahman", "নিউরোসার্জারি", "A-69483", "সিলেট", "সিলেট", "Sylhet MAG Osmani Medical College and Hospital (Registrar, Neurosurgery)", "", TBD, TBD, "dr-md-touhidur-rahman"),
  seed("seed-31", "Dr. A K M Khairul Basher", "শিশু রোগ", "A-39305", "ঢাকা", "ঢাকা", "Dhaka Medical College (Assistant Professor, Pediatric Surgery)", "", TBD, TBD, "dr-a-k-m-khairul-basher"),
  seed("seed-32", "Dr. Md. Tanvir Hasan Mojumdar (Tanim)", "নিউরোসার্জারি", "A-59716", "ঢাকা", "ঢাকা", "Dhaka Medical College Hospital (Neurosurgery, Skullbase Surgery Fellow)", "", TBD, TBD, "dr-md-tanvir-hasan-mojumdar-tanim"),
  seed("seed-33", "Dr. Md. Shahnawas Biswas", "নিউরোসার্জারি", "A-66694", "ঢাকা", "ঢাকা", "Dhaka Medical College Hospital (Resident Surgeon, Neurosurgery)", "", TBD, TBD, "dr-md-shahnawas-biswas"),
];

// slug registry (parallel to entries above, same order)
[
  "professor-dr-md-shafiqul-islam",
  "professor-dr-sayeed-ahmed-siddiky",
  "prof-dr-nasir-uddin",
  "dr-golam-mustafa",
  "professor-dr-md-abdul-wohab-khan",
  "professor-dr-istiaq-ahmed-dipu",
  "dr-chowdhury-rashedul-mughni",
  "dr-md-alamgir-hossain-jony",
  "dr-nashir-uddin",
  "dr-m-m-hasan-shiplu",
  "professor-dr-md-zahid-raihan",
  "dr-a-kh-m-ariful-islam-nobin",
  "dr-md-emranul-islam-abir",
  "dr-sumit-ranjan-basak",
  "prof-dr-a-f-m-momtazul-haque",
  "professor-dr-md-abdul-quader",
  "dr-ishtiaq-alam",
  "dr-s-chakrabarty",
  "dr-monzurul-karim",
  "dr-md-rustam-ali-madhu",
  "dr-farhad-hossain-md-shahed",
  "dr-m-h-pannu",
  "dr-sharmin-afroz",
  "prof-dr-bijoy-krishna-das",
  "dr-md-sayeef-ullah-sujan",
  "drmohammad-yousuf-ali",
  "dr-md-akter-kamal-perveg",
  "dr-nafiz-rahman",
  "dr-md-mahfujullha",
  "dr-md-touhidur-rahman",
  "dr-a-k-m-khairul-basher",
  "dr-md-tanvir-hasan-mojumdar-tanim",
  "dr-md-shahnawas-biswas",
].forEach((slug, i) => reg(`seed-${String(i + 1).padStart(2, "0")}`, slug));

export function filterSeed(f: { district?: string; area?: string; specialty?: string }): Doctor[] {
  return SEED_DOCTORS.filter(
    (d) =>
      (!f.district || d.location_district === f.district) &&
      (!f.area || d.location_upazila_area === f.area) &&
      (!f.specialty || d.specialty_bn === f.specialty),
  ).map(withPhoto);
}

export function findSeed(id: string): Doctor | undefined {
  const d = SEED_DOCTORS.find((d) => d.id === id);
  return d ? withPhoto(d) : undefined;
}
