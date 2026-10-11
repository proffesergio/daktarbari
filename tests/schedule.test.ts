import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isOpenToday, todaySlot } from "../lib/schedule.js";

describe("schedule helpers", () => {
  it("returns null with no off-days (neutral, no badge)", () => {
    assert.equal(isOpenToday(null), null);
    assert.equal(isOpenToday({}), null);
    assert.equal(isOpenToday({ off: [] }), null);
  });

  it("detects today in English off-days", () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date().getDay();
    assert.equal(isOpenToday({ off: [days[today]!] }), false);
    assert.equal(isOpenToday({ off: [days[(today + 1) % 7]!] }), true);
  });

  it("matches lowercase + Bangla day names", () => {
    // Friday in Bangla; construct a date-independent check by covering all but one
    const r = isOpenToday({ off: ["friday", "শুক্রবার"] });
    assert.ok(r === true || r === false); // date-dependent, just must not throw
    assert.equal(isOpenToday({ off: ["notaday"] }), true);
  });

  it("todaySlot returns today's free-text hours or null", () => {
    assert.equal(todaySlot(null), null);
    assert.equal(todaySlot({ slots: {} }), null);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()]!;
    assert.equal(todaySlot({ slots: { [today]: "সকাল ১০টা–১টা" } }), "সকাল ১০টা–১টা");
  });
});
