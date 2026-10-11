import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../lib/csv.js";
import { doctorSubmitSchema } from "../lib/validation.js";
import { findConsensusIds } from "../lib/consensus.js";
import { partitionNewIds } from "../lib/sheetSync.js";

describe("parseCsv (bulk import)", () => {
  it("parses quoted Bengali fields containing commas", () => {
    const rows = parseCsv('name_bn,chamber_address_bn\n"ডাঃ রহিম","মিরপুর ১০, ঢাকা"\n');
    assert.deepEqual(rows, [["name_bn", "chamber_address_bn"], ["ডাঃ রহিম", "মিরপুর ১০, ঢাকা"]]);
  });

  it("handles escaped quotes, CRLF and blank lines", () => {
    const rows = parseCsv('a,b\r\n"x""y",2\r\n\r\n3,4\r\n');
    assert.deepEqual(rows, [["a", "b"], ['x"y', "2"], ["3", "4"]]);
  });

  it("strips BOM", () => {
    assert.deepEqual(parseCsv("﻿a,b\n1,2"), [["a", "b"], ["1", "2"]]);
  });
});

describe("doctorSubmitSchema (submit + import validation)", () => {
  const good = {
    name_bn: "ডাঃ রহিম",
    specialty_bn: "মেডিসিন",
    location_district: "ঢাকা",
    location_upazila_area: "মিরপুর",
    chamber_address_bn: "মিরপুর ১০ হেলথ কেয়ার",
    appointment_contact: "01712-345678",
    visiting_hours_bn: "বিকাল ৪টা",
    visiting_fee_approx: "৫০০",
  };

  it("accepts a valid row and normalizes the phone", () => {
    const p = doctorSubmitSchema.safeParse(good);
    assert.equal(p.success, true);
    if (p.success) assert.equal(p.data.appointment_contact, "01712345678");
  });

  it("rejects bad phone and short names", () => {
    assert.equal(doctorSubmitSchema.safeParse({ ...good, appointment_contact: "01234" }).success, false);
    assert.equal(doctorSubmitSchema.safeParse({ ...good, name_bn: "র" }).success, false);
    assert.equal(doctorSubmitSchema.safeParse({ ...good, chamber_address_bn: "ক" }).success, false);
  });
});

describe("findConsensusIds (verify auto-apply rule)", () => {
  const rows = [
    { id: "a", note: "সকাল ১০টা" },
    { id: "b", note: "সকাল ১০টা " },
    { id: "c", note: "সকাল ১০টা" },
    { id: "d", note: "বিকাল ৪টা" },
  ];

  it("returns ids at threshold (whitespace-insensitive)", () => {
    assert.deepEqual(findConsensusIds(rows, "সকাল ১০টা", 3), ["a", "b", "c"]);
  });

  it("returns [] below threshold or for empty notes", () => {
    assert.deepEqual(findConsensusIds(rows, "বিকাল ৪টা", 3), []);
    assert.deepEqual(findConsensusIds(rows, "", 3), []);
    assert.deepEqual(findConsensusIds(rows, "সকাল ১০টা", 4), []);
  });
});

describe("partitionNewIds (DB-wins sync rule)", () => {
  it("imports only ids missing from the DB, dedupes sheet repeats", () => {
    const { fresh, skipped } = partitionNewIds(["a", "b", "b", "c", ""], new Set(["b"]));
    assert.deepEqual(fresh, ["a", "c"]);
    assert.equal(skipped, 1); // b was already in DB
  });

  it("never regresses: existing ids are always skipped", () => {
    const { fresh } = partitionNewIds(["x"], new Set(["x"]));
    assert.deepEqual(fresh, []);
  });
});
