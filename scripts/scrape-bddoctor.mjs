// Scraper: bddoctor.com departments → data/bddoctors.json + photos + Sheet.
// Usage:
//   node scripts/scrape-bddoctor.mjs --dept=Medicine --max-pages=2 --photos --sheet
//   node scripts/scrape-bddoctor.mjs --all --photos --sheet
// Ids bd-<slug>-<nnn> are stable → re-runs never duplicate (Sheet + JSON merge by id).
import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) daktarbari-seed/1.0";

export const DEPTS = {
  "Medicine": "মেডিসিন",
  "General-Practitioner": "জেনারেল প্র্যাকটিশনার",
  "Gynecologist-&-Obstetrician": "গাইনি ও প্রসূতি",
  "Cardiologist": "হৃদরোগ",
  "Paediatrics-&-Neonatologist": "শিশু রোগ",
  "Endocrinologist": "ডায়াবেটিস ও হরমোন",
  "Surgery": "জেনারেল সার্জারি",
  "Dentist": "ডেন্টাল (দাঁত)",
  "Orthopedist": "অর্থোপেডিক (হাড়)",
  "Neurologist": "নিউরোলজি (স্নায়ু)",
  "Nephrologist": "কিডনি",
  "ENT": "নাক-কান-গলা",
  "Ophthalmologist": "চক্ষু",
  "Dermatologist": "চর্ম ও যৌন",
  "Urologist": "ইউরোলজি",
  "Gastroenterologist": "গ্যাস্ট্রোএন্টারোলজি",
  "Oncologist": "ক্যান্সার",
  "Rheumatologists": "রিউমাটোলজি",
  "Neurosurgeon": "নিউরোসার্জারি",
  "Hepatologist": "হেপাটোলজি (লিভার)",
  "Psychiatrist": "মানসিক স্বাস্থ্য",
  "Anesthesiologist": "অ্যানেসথেসিওলজি",
  "Respiratory-&-chest-specialist": "বক্ষব্যাধি (শ্বাসতন্ত্র)",
  "Plastic-Surgeon": "প্লাস্টিক সার্জারি",
  "Hematologist": "হেমাটোলজি",
  "Vascular-Surgeon": "ভাস্কুলার সার্জারি",
  "Laparoscopic-Surgeon": "ল্যাপারোস্কোপিক সার্জারি",
};

const DIST_BN = { Dhaka: "ঢাকা", Gazipur: "গাজীপুর", Pabna: "পাবনা", Khulna: "খুলনা", Rangpur: "রংপুর", Patuakhali: "পটুয়াখালী", Thakurgaon: "ঠাকুরগাঁও", Tangail: "টাঙ্গাইল", Nilphamari: "নীলফামারী", Chittagong: "চট্টগ্রাম", Chattogram: "চট্টগ্রাম", Sylhet: "সিলেট", Rajshahi: "রাজশাহী", Barisal: "বরিশাল", Barishal: "বরিশাল", Mymensingh: "ময়মনসিংহ", Cumilla: "কুমিল্লা", Comilla: "কুমিল্লা", Bogra: "বগুড়া", Bogura: "বগুড়া", Dinajpur: "দিনাজপুর", Faridpur: "ফরিদপুর", Jessore: "যশোর", Jashore: "যশোর", Kushtia: "কুষ্টিয়া", Noakhali: "নোয়াখালী", Feni: "ফেনী", Coxsbazar: "কক্সবাজার", "Cox's Bazar": "কক্সবাজার", Brahmanbaria: "ব্রাহ্মণবাড়িয়া", Chandpur: "চাঁদপুর", Habiganj: "হবিগঞ্জ", Maulvibazar: "মৌলভীবাজার", Sunamganj: "সুনামগঞ্জ", Narsingdi: "নরসিংদী", Narayanganj: "নারায়ণগঞ্জ", Munshiganj: "মুন্সিগঞ্জ", Manikganj: "মানিকগঞ্জ", Kishoreganj: "কিশোরগঞ্জ", Jamalpur: "জামালপুর", Sherpur: "শেরপুর", Netrokona: "নেত্রকোণা", Tangail2: "টাঙ্গাইল", Kurigram: "কুড়িগ্রাম", Lalmonirhat: "লালমনিরহাট", Gaibandha: "গাইবান্ধা", Joypurhat: "জয়পুরহাট", Naogaon: "নওগাঁ", Natore: "নাটোর", Nawabganj: "চাঁপাইনবাবগঞ্জ", Chapainawabganj: "চাঁপাইনবাবগঞ্জ", Sirajganj: "সিরাজগঞ্জ", Meherpur: "মেহেরপুর", Chuadanga: "চুয়াডাঙ্গা", Jhenaidah: "ঝিনাইদহ", Magura: "মাগুরা", Narail: "নড়াইল", Satkhira: "সাতক্ষীরা", Bagerhat: "বাগেরহাট", Jhalokati: "ঝালকাঠি", Pirojpur: "পিরোজপুর", Patuakhali2: "পটুয়াখালী", Barguna: "বরগুনা", Bhola: "ভোলা", Lakshmipur: "লক্ষ্মীপুর", Shariatpur: "শরীয়তপুর", Madaripur: "মাদারীপুর", Gopalganj: "গোপালগঞ্জ", Rajbari: "রাজবাড়ী", Khagrachari: "খাগড়াছড়ি", Rangamati: "রাঙ্গামাটি", Bandarban: "বান্দরবান" };

function loadEnv() {
  const f = path.join(ROOT, ".env.local");
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

const clean = (s) => (s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function parseCards(html) {
  const out = [];
  for (const block of html.split('<div class="aon-med-team">').slice(1)) {
    const img = block.match(/<img src="([^"]+)"[^>]*alt="([^"]*)"/);
    const href = block.match(/<a href="([^"]+)" target="_blank">/);
    const name = block.match(/<h4 class="aon-title dName">([^<]+)<\/h4>/);
    const deg = block.match(/<p class="aon-med-team-discription">([\s\S]*?)<\/p>/);
    const spec = block.match(/Specialities:<\/span>([\s\S]*?)<\/p>/);
    const work = block.match(/Working\s+in:<\/span>([\s\S]*?)<\/p>/);
    const area = block.match(/Working\s+Area:<\/span>([\s\S]*?)<\/div>/);
    if (!name) continue;
    out.push({
      name: clean(name[1]),
      profile: href ? href[1] : "",
      photo: img ? img[1] : "",
      degree: clean(deg?.[1]),
      specialty: clean(spec?.[1]).split("\n")[0],
      hospital: clean(work?.[1]),
      area: clean(area?.[1]),
    });
  }
  return out;
}

function splitArea(raw) {
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { district: "ঢাকা", area: "ঢাকা" };
  const dEn = parts[0].replace(/^\w+\.\s*/, "");
  const key = Object.keys(DIST_BN).find((k) => k.toLowerCase() === dEn.toLowerCase());
  return { district: key ? DIST_BN[key] : dEn, area: parts.slice(1).join(", ") || parts[0] };
}

async function pool(items, n, fn) {
  const ret = [];
  for (let i = 0; i < items.length; i += n) ret.push(...await Promise.all(items[i] ? items.slice(i, i + n).map(fn) : []));
  return ret;
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
  loadEnv();
  const slugs = args.all ? Object.keys(DEPTS) : (args.depts ?? args.dept ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!slugs.length || slugs.some((s) => !(s in DEPTS))) { console.error("use --dept=Slug or --all"); process.exit(1); }
  const doPhotos = !!args.photos;
  const doSheet = !!args.sheet;
  const maxPages = args["max-pages"] ? +args["max-pages"] : 999;

  const dataFile = path.join(ROOT, "data", "bddoctors.json");
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.mkdirSync(path.join(ROOT, "public", "doctors"), { recursive: true });
  const store = new Map();
  if (fs.existsSync(dataFile)) for (const d of JSON.parse(fs.readFileSync(dataFile, "utf8"))) store.set(d.id, d);

  let sheet = null, haveIds = new Set();
  if (doSheet) {
    const { google } = await import("googleapis");
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    sheet = google.sheets({ version: "v4", auth });
    const sid = process.env.GOOGLE_SHEET_ID;
    for (const tab of ["Pending", "Approved"]) {
      const r = await sheet.spreadsheets.values.get({ spreadsheetId: sid, range: `${tab}!A:A` });
      for (const row of r.data.values ?? []) haveIds.add(row[0]);
    }
  }

  const T = new Date().toISOString();
  let added = 0, photos = 0;
  for (const slug of slugs) {
    const bn = DEPTS[slug];
    const first = await get(`https://bddoctor.com/department/${slug}`);
    const totalM = first.match(/of\s*<span[^>]*>(\d+)<\/span>\s*results/) ?? first.match(/of (\d+) results/);
    const total = +(totalM?.[1] ?? 0);
    let maxLink = 1;
    for (const m of first.matchAll(/\?page=(\d+)/g)) maxLink = Math.max(maxLink, +m[1]);
    const pages = Math.min(Math.max(1, Math.ceil(total / 12), maxLink), maxPages);
    console.log(`${slug}: total=${total} pages=${pages}`);
    const cards = (await pool(Array.from({ length: pages }, (_, i) => i + 1), 4, async (p) => {
      await new Promise((r) => setTimeout(r, 400));
      return parseCards(p === 1 ? first : await get(`https://bddoctor.com/department/${slug}?page=${p}`));
    })).flat();

    const rows = [];
    cards.forEach((c, i) => {
      const id = `bd-${slug.toLowerCase().replace(/[^a-z]+/g, "")}-${String(i + 1).padStart(3, "0")}`;
      if (store.has(id)) return;
      const { district, area } = splitArea(c.area);
      const doc = {
        id, name_bn: c.name, name_en: c.name, specialty_bn: bn, bmdc_reg_no: null,
        location_district: district, location_upazila_area: area,
        chamber_address_bn: c.hospital || "ঠিকানা যাচাই প্রয়োজন",
        appointment_contact: "", visiting_hours_bn: "", visiting_fee_approx: "",
        photo_url: "", degree: c.degree, profile_url: c.profile,
        status: "PENDING", upvotes: 0, downvotes: 0, reports: 0, created_at: T,
      };
      store.set(id, doc);
      rows.push(doc);
      added++;
    });

    if (doPhotos) {
      let sharp = null;
      try { sharp = (await import("sharp")).default; } catch { /* fallback: raw */ }
      await pool(rows.filter((d) => store.get(d.id)?.photo_url === ""), 6, async (d) => {
        const c = cards.find((_, i) => `bd-${slug.toLowerCase().replace(/[^a-z]+/g, "")}-${String(i + 1).padStart(3, "0")}` === d.id);
        const url = c?.photo;
        if (!url) return;
        try {
          const r = await fetch(url, { headers: { "User-Agent": UA } });
          if (!r.ok) return;
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length < 3000) return;
          const file = `${d.id}.jpg`;
          if (sharp) {
            await sharp(buf).resize(256, 256, { fit: "cover" }).jpeg({ quality: 70 }).toFile(path.join(ROOT, "public", "doctors", file));
          } else {
            fs.writeFileSync(path.join(ROOT, "public", "doctors", file), buf);
          }
          d.photo_url = `/doctors/${file}`;
          store.set(d.id, d);
          photos++;
        } catch { /* keep initials fallback */ }
      });
    }

    if (doSheet && sheet) {
      const sid = process.env.GOOGLE_SHEET_ID;
      const fresh = rows.filter((d) => !haveIds.has(d.id));
      for (let i = 0; i < fresh.length; i += 50) {
        const chunk = fresh.slice(i, i + 50);
        await sheet.spreadsheets.values.append({
          spreadsheetId: sid, range: "Pending!A:N", valueInputOption: "RAW",
          requestBody: { values: chunk.map((d) => [d.id, d.name_bn, d.name_en, d.specialty_bn, "", d.location_district, d.location_upazila_area, d.chamber_address_bn, "", "", "", "PENDING", d.created_at, d.photo_url]) },
        });
        chunk.forEach((d) => haveIds.add(d.id));
      }
      console.log(`  sheet += ${fresh.length}`);
    }
    fs.writeFileSync(dataFile, JSON.stringify([...store.values()], null, 1));
    console.log(`  new=${rows.length} photos=${photos} store=${store.size}`);
  }
  console.log(`DONE added=${added} photos_total=${photos}`);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
