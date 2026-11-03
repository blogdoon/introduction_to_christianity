# Content schema for Introduction to Christianity learning site

Output ONE JSON file (path given in your task). Valid JSON, no comments, no trailing commas.

```json
{
  "part": "intro",
  "partTitle": "Introduction: \u201cI Believe\u2014Amen\u201d",
  "creedLine": "I believe in God, the Father almighty, creator of heaven and earth.",
  "cards": [
    {
      "id": "intro-1-2",
      "order": 2,
      "section": "Introduction I.2",
      "title": "The origin of belief",
      "pages": [28, 33],
      "idea": "One big idea, maximum 30 words. The single sentence a learner must retain.",
      "before": "One provocative question to hold in mind BEFORE reading this section.",
      "after": "The payoff answer the section gives, 1-2 sentences.",
      "why": "Ratzinger's twist: why this is surprising or memorable, 1-2 sentences.",
      "quote": "Verbatim quote from the book, 5-25 words.",
      "quotePage": 30,
      "cloze": [
        {"pre": "verbatim lead-in ", "blank": "word or short phrase from the book", "post": " verbatim continuation"}
      ],
      "recall": "One open-ended question the learner answers in their own words.",
      "tags": ["faith and reason"]
    }
  ]
}
```

Field rules:
- `id`: unique, kebab-case, prefixed with your part (intro-, p1-, p2a-, p2b-, p3-).
- `order`: 1-based running number within your file.
- `pages`: [firstPage, lastPage] as 1-BASED PDF PAGE NUMBERS. The book text is at
  `build/book.txt`; splitting it on form-feed `\f` gives one chunk per PDF page, so chunk
  index (1-based) == PDF page. Verify your page numbers this way.
- `idea`: hard limit 30 words.
- `quote`: MUST be verbatim from the book. Verify with grep against `build/book.txt`
  (mind that the PDF uses curly quotes and \u2014 dashes; match a short distinctive substring).
  `quotePage` = the PDF page where the quote sits (verify, don't guess).
- `cloze`: exactly 3 per card. Sentences should be verbatim from the section with one
  meaningful word/phrase pulled out into `blank`. `pre` + `blank` + `post` = the original
  sentence. Test the idea, not trivia.
- `recall`: open-ended, requires explaining, not yes/no.
- `tags`: 1-3 from this vocabulary (reuse these exact strings):
  "faith and reason", "logos vs myth", "the name of God", "God of the philosophers",
  "Trinity", "Incarnation", "Cross", "resurrection", "Creed and dogma",
  "subjective faith", "eschatology", "Church", "being a Christian today",
  "history and modernity", "creation".
- Quote and cloze text must be in English, matching the book's translation.

Write only the JSON file. Your final reply: one line with the file path and card count.
