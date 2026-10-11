import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applySearch } from "../lib/search.js";
import type { Doctor } from "../lib/types.js";

const base: Doctor = {
  id: "t-1",
  name_bn: "ডাঃ টেস্ট",
  name_en: "Dr. Test",
  specialty_bn: "মেডিসিন",
  bmdc_reg_no: null,
  location_division: "ঢাকা",
  location_district: "ঢাকা",
  location_upazila_area: "মিরপুর",
  chamber_address_bn: "মিরপুর ১০",
  appointment_contact: "01712345678",
  visiting_hours_bn: "বিকাল ৪টা",
  visiting_fee_approx: "৫০০",
  fee_min: 500,
  status: "APPROVED",
  upvotes: 0,
  downvotes: 0,
  reports: 0,
  created_at: new Date().toISOString(),
};

const noPhone: Doctor = { ...base, id: "t-2", appointment_contact: "" };
const noFee: Doctor = { ...base, id: "t-3", visiting_fee_approx: "", fee_min: null };
const er: Doctor = { ...base, id: "t-4", visiting_hours_bn: "২৪ ঘণ্টা জরুরি" };

describe("applySearch availability filters", () => {
  it("phoneOnly drops records without a valid number", () => {
    const out = applySearch([base, noPhone], { phoneOnly: true });
    assert.deepEqual(out.map((d) => d.id), ["t-1"]);
  });

  it("bmdcOnly keeps only BMDC holders", () => {
    const withBmdc = { ...base, id: "t-5", bmdc_reg_no: "A1" };
    const out = applySearch([base, withBmdc], { bmdcOnly: true });
    assert.deepEqual(out.map((d) => d.id), ["t-5"]);
  });

  it("feeKnown + hoursKnown compose", () => {
    const noHours = { ...base, id: "t-6", visiting_hours_bn: "" };
    const out = applySearch([base, noFee, noHours], { feeKnown: true, hoursKnown: true });
    assert.deepEqual(out.map((d) => d.id), ["t-1"]);
  });

  it("emergencyOnly needs phone + emergency hours", () => {
    const out = applySearch([base, er], { emergencyOnly: true });
    assert.deepEqual(out.map((d) => d.id), ["t-4"]);
  });

  it("sort=complete puts the fullest profile first", () => {
    const out = applySearch([noFee, base], { sort: "complete" });
    assert.equal(out[0]!.id, "t-1");
  });

  it("multi-token q matches across name/address", () => {
    const out = applySearch([base, noPhone], { q: "টেস্ট মিরপুর" });
    assert.equal(out.length, 2);
    const none = applySearch([base], { q: "টেস্ট চট্টগ্রাম" });
    assert.equal(none.length, 0);
  });
});
