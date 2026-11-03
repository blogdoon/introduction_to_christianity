/* One runnable check for the non-trivial logic in app.js. */
const assert = require("assert");
const { schedule, norm, buildItems, buildPlan, buildIcs, reflow } = require("./app.js");

// text normalization: punctuation and case must not matter in the practice quiz
assert.strictEqual(norm("  Cor-Dare!  "), "cor dare");
assert.strictEqual(norm("“I believe—in you”"), "i believe in you");

// first Good review -> 1 day; ease unchanged
let s = { ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: "2026-01-01" };
assert.strictEqual(schedule(s, 2), 1);
assert.strictEqual(s.due.length, 10);

// Good again -> interval grows by ease
schedule(s, 2);
assert.ok(s.ivl > 1, "interval should grow after a second Good");

// Easy raises ease, Hard lowers it
const before = s.ease;
schedule(s, 3);
assert.ok(s.ease > before, "Easy should raise ease");
const b2 = s.ease;
schedule(s, 1);
assert.ok(s.ease < b2, "Hard should lower ease");

// Again resets the interval, counts a lapse, never drops ease below 1.3
for (let i = 0; i < 20; i++) schedule(s, 0);
assert.strictEqual(s.ivl, 0);
assert.strictEqual(s.ease, 1.3);
assert.strictEqual(s.lapses, 20);

// review items: 1 recall + 3 cloze per card
const fakeCards = [{ id: "x", cloze: [{}, {}, {}] }, { id: "y", cloze: [{}, {}, {}] }];
const items = buildItems(fakeCards);
assert.strictEqual(items.length, 8);
assert.deepStrictEqual(items.map((i) => i.id), ["x#r", "x#c0", "x#c1", "x#c2", "y#r", "y#c0", "y#c1", "y#c2"]);
assert.ok(items.every((i) => i.kind === (i.id.endsWith("#r") ? "recall" : "cloze")));

// plan: one idea a day, grouped into Monday-starting weeks
const start = new Date("2026-01-05T00:00:00"); // a Monday
const sessions = buildPlan(Array.from({ length: 13 }, (_, i) => ({ id: "c" + i, title: "t", pages: [1, 2], idea: "x" })), start);
assert.strictEqual(sessions.length, 13);
assert.strictEqual(sessions[0].date.getDay(), 1, "week starts Monday");
assert.strictEqual(new Date(sessions[7].date).getDay(), 1, "second week restarts on Monday");
assert.strictEqual(new Date(sessions[7].date - sessions[0].date).getUTCDate(), 8, "second week is +7 days");

// ics: well-formed, one event per session
const ics = buildIcs(sessions);
assert.ok(ics.startsWith("BEGIN:VCALENDAR") && ics.trimEnd().endsWith("END:VCALENDAR"));
assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 13);
assert.ok(ics.includes("SUMMARY:Read:"), "events carry the reading title");
assert.ok(!/SUMMARY:.*[,;]/.test(ics.split("SUMMARY:")[1].split("\r\n")[0].replace(/\\[;,]/g, "")), "ics values are escaped");

// reader reflow: line-break hyphens join only when the joined word is attested
const words = new Set(["understanding", "self-enclosure"]);
assert.strictEqual(reflow("understand-\ning of God", words), "understanding of God");
assert.strictEqual(reflow("self-\nenclosure is hell", words), "self-enclosure is hell");
assert.strictEqual(reflow("all-\nembracing nature", words), "all-embracing nature");
assert.strictEqual(reflow("the  God\nof Abraham", words), "the God of Abraham");

console.log("check.js: all assertions passed");
