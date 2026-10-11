import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  isValidBdPhone,
  toWhatsAppNumber,
  whatsappLink,
  completenessScore,
  isEmergencyCapable,
} from "../lib/completeness.js";

describe("phone helpers (fraud-sensitive paths)", () => {
  it("normalizes spaces/dashes/parens", () => {
    assert.equal(normalizePhone("01 712-345(678)"), "01712345678");
  });

  it("accepts valid Grameenphone-style numbers", () => {
    assert.equal(isValidBdPhone("01712345678"), true);
    assert.equal(isValidBdPhone("01312345678"), true);
    assert.equal(isValidBdPhone("01999999999"), true);
  });

  it("rejects bad prefixes, wrong lengths, landlines", () => {
    assert.equal(isValidBdPhone("01212345678"), false);
    assert.equal(isValidBdPhone("0171234567"), false);
    assert.equal(isValidBdPhone("017123456789"), false);
    assert.equal(isValidBdPhone(""), false);
    assert.equal(isValidBdPhone(null), false);
    assert.equal(isValidBdPhone("02-9661234"), false);
  });

  it("builds wa.me links with 880 prefix", () => {
    assert.equal(toWhatsAppNumber("01712345678"), "8801712345678");
    assert.equal(toWhatsAppNumber("bad"), null);
    const link = whatsappLink("01712345678", "হ্যালো");
    assert.ok(link?.startsWith("https://wa.me/8801712345678?text="));
    assert.equal(whatsappLink("01200000000"), null);
  });
});

describe("completenessScore (admin queue + sort)", () => {
  const full = {
    appointment_contact: "01712345678",
    visiting_fee_approx: "৫০০",
    visiting_hours_bn: "বিকাল ৪টা",
    chamber_address_bn: "মিরপুর ১০",
    bmdc_reg_no: "A123",
    location_district: "ঢাকা",
    location_upazila_area: "মিরপুর",
  };

  it("scores 6/6 for a complete record", () => {
    const c = completenessScore(full);
    assert.equal(c.score, 6);
    assert.deepEqual(c.missing, []);
  });

  it("flags each missing field in Bengali", () => {
    const c = completenessScore({ ...full, appointment_contact: "", bmdc_reg_no: "" });
    assert.equal(c.score, 4);
    assert.ok(c.missing.includes("ফোন"));
    assert.ok(c.missing.includes("BMDC"));
    assert.equal(c.hasPhone, false);
  });

  it("counts fee_min as fee even without fee text", () => {
    const c = completenessScore({ ...full, visiting_fee_approx: "", fee_min: 500 });
    assert.equal(c.hasFee, true);
  });
});

describe("isEmergencyCapable (honest keyword match only)", () => {
  it("needs a valid phone first", () => {
    assert.equal(isEmergencyCapable({ appointment_contact: "", visiting_hours_bn: "২৪ ঘণ্টা" }), false);
  });

  it("matches ২৪ / 24 / জরুরি / emergency", () => {
    const phone = "01712345678";
    assert.equal(isEmergencyCapable({ appointment_contact: phone, visiting_hours_bn: "২৪ ঘণ্টা খোলা" }), true);
    assert.equal(isEmergencyCapable({ appointment_contact: phone, visiting_hours_bn: "Open 24 hours" }), true);
    assert.equal(isEmergencyCapable({ appointment_contact: phone, visiting_hours_bn: "জরুরি বিভাগ" }), true);
    assert.equal(isEmergencyCapable({ appointment_contact: phone, visiting_hours_bn: "বিকাল ৪টা–৮টা" }), false);
  });
});
