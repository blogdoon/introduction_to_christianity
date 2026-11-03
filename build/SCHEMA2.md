# Nuance-layer content schema (round 2)

Source: `build/book.txt` — one PDF page per form-feed chunk (chunk index 1-based == PDF page).
Every `quote` MUST be verbatim (verify with grep on a short distinctive substring; mind curly
quotes and em dashes) and every `page` must be verified, not guessed. Valid JSON only.

## 1. Nuance files — `src/nuance-intro.json`, `src/nuance-p1.json`, `src/nuance-p2a.json`, `src/nuance-p2b3.json`

```json
{"cards": [{
  "id": "intro-5",
  "misreading": {
    "wrong": "The most tempting wrong reading, max 25 words, stated as a plausible claim.",
    "right": "What Ratzinger actually claims, max 25 words.",
    "quote": "Verbatim quote, max 20 words, where he says it.",
    "page": 49
  },
  "argument": {
    "tension": "The two poles he sets up, max 22 words.",
    "move": "His dialectical move, max 22 words.",
    "payoff": "What the move wins, max 22 words."
  },
  "rubric": ["element 1 of a good answer, max 8 words", "element 2", "element 3"]
}]}
```

- `id` must match an existing card id exactly (see the list in your task).
- `misreading.wrong` must be genuinely tempting — a misreading a smart reader would make.
- `rubric`: the 3 things a learner's own-word answer must contain to count as understood.

## 2. Glossary — `src/nuance-glossary.json`

```json
{"terms": [{
  "id": "cor-dare",
  "term": "cre-do / cor-dare",
  "origin": "Latin",
  "pronunciation": "KREH-do / kor-DARE",
  "definition": "Max 30 words.",
  "nuance": "Why Ratzinger leans on it, max 30 words.",
  "page": 49,
  "cards": ["intro-5", "intro-6"]
}]}
```

28-32 terms: Latin (cre-do/cor-dare, etsi Deus non daretur, fides quae/fides qua, Deus
absconditus/revelatus, analogia entis, kenosis, pro nobis, homoousios, etc.), Greek (logos,
ousia/hypostasis, kyrios), Hebrew (Ehyeh asher Ehyeh, Yahweh, El/Elohim), German where the
book's own vocabulary turns on it. `cards` = ids of cards where the term does work.

## 3. Thinkers — `src/nuance-thinkers.json`

```json
{"thinkers": [{
  "id": "bultmann",
  "name": "Rudolf Bultmann",
  "tradition": "New Testament scholar; demythologizing, max 10 words",
  "claim": "His position, max 25 words.",
  "counter": "Ratzinger's answer, max 25 words.",
  "quote": "Verbatim quote, max 20 words.",
  "page": 120,
  "cards": ["p2a-2"]
}]}
```

12-14 thinkers, mix of allies (Balthasar, de Lubac, Guardini, Augustine, Anselm, Aquinas,
Irenaeus) and foils (Bultmann, Feuerbach, Marx, Nietzsche, Hegel, Bloch, Kant, Sartre or
Heidegger, Rahner where Ratzinger distances himself). Ground every entry in the text or the
Notes (pp. ~253-272) and give the page of YOUR quote.

## 4. Context — `src/nuance-context.json`

```json
{"corrections": [{
  "id": "divinization",
  "year": 2000,
  "title": "Max 8 words",
  "what": "The correction/clarification, max 40 words.",
  "quote": "Verbatim, max 20 words.",
  "page": 18,
  "cards": ["p1-13", "p1-14"]
}],
"scripture": [{
  "id": "ex3",
  "ref": "Exodus 3:14",
  "text": "The verse/passage, max 20 words.",
  "ratzinger": "What he does with it, max 35 words.",
  "page": 81,
  "cards": ["p1-3"]
}]}
```

- `corrections`: 5-7 items where the prefaces (pp. 11-27) clarify, correct or reframe the
  1968 text (e.g. the fear that bracketing Christ's divinity makes him more accessible —
  Guardini's correction; the charge of "divinizing the world"; 1968 vs 1989).
- `scripture`: 8-10 biblical passages the book builds on (Ex 3; Acts 17; the vineyard/tenant
  parable; Phil 2; Col 1; Rev 20; the burning bush; the good shepherd; John 1, etc.).

## 5. Creed words — `src/nuance-creed.json`

```json
{"words": [{
  "word": "catholic",
  "article": 9,
  "means": "Max 25 words.",
  "excludes": "The wrong meaning it rules out, max 25 words.",
  "quote": "Verbatim, max 20 words.",
  "page": 238,
  "cards": ["p3-2"]
}]}
```

12-15 entries covering the Creed's load-bearing words. `article` index: 0="I believe in God,
the Father almighty, creator", 1="and in Jesus Christ, his only Son, our Lord", 2="conceived
by the power of the Holy Spirit, born of the Virgin Mary", 3="suffered under Pontius Pilate...",
4="descended into hell", 5="rose again", 6="ascended", 7="will come again to judge",
8="I believe in the Holy Spirit", 9="the holy catholic Church", 10="communion of saints,
forgiveness of sins", 11="resurrection of the body, life everlasting".
