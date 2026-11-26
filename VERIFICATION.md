# Verification record

Verified November 25, 2026. This revision adds eight complete subject paths and retains the original high-yield course separately.

## Content

- Eight full paths: 137 original lessons and 685 checks; five checks per lesson.
- Separate high-yield course: 13 lessons and 65 checks; five checks per lesson.
- 150 lessons, 750 checks, and 672 teaching screens in total.
- Full-path teaching, goals, terms, table cells, flow steps, examples, choices, matching labels/rows, matrix columns/rows, ordered actions, keys, and rationales compared against the actual nine supplied PDFs. No unmatched content in the full-path audit.
- All 685 full-path keys compared with the printed exact keys, including 42 matrix and two ordered-response checks.
- The original 65 high-yield checks and their option rationales remain unchanged.
- The eight full paths contain 367 single-choice, 137 select-all, 137 matching, 42 matrix, and two ordered-response checks. The high-yield course contains 46 single-choice, 12 select-two, and seven matching checks.
- Clinical context, source qualifications, course objective summaries, and source locators remain attached. PDFs and personal PDF annotations are excluded from the published files.

## Behavior

- Scoring tested against 45,638 complete selection combinations/permutations across all formats.
- Browser-rendered all 672 teaching screens and all 750 checks. Every correct answer submitted through the form and every supplied rationale verified in feedback. Feedback absent before submission; submission does not advance automatically.
- Existing high-yield saved-state migration preserves lesson completion, answers, missed checks, and last position under the same storage key.
- Saved-state round-trip checks cover all 150 completed lessons, 750 attempts, and nine path positions.
- Navigation, Back/Next, path lesson lists, sources, hidden answers, incorrect attempts, missed review, and refresh persistence checked in the browser.
- Browser viewport checks cover phone and iPad portrait/landscape layouts. These are simulations, not physical-device or Safari tests.

Supporting machine-readable audits and screenshots are stored alongside the publishing folder in `nur2460-exam4-verification`.

## Compact layout and dark mode update

- Reduced the first full-path lesson card start from 415px to 181px at a 430 × 932 CSS-pixel viewport; body text remains 18.36px.
- Checked 430 × 932 and 932 × 430 phone layouts, 820 × 1180 tablet, and 320px narrow-screen layout. No horizontal overflow. Safe-area CSS supports landscape insets. These are browser viewport checks, not physical iPhone Safari tests.
- Checked light and dark mode, collapsed/expanded lesson details, all six question formats, hidden feedback before submitting, scoring, option rationales, source dialogs, navigation, and saved position after refresh.
- Verified automatic system dark mode, manual override after refresh, and unchanged study progress when toggling the theme. Body and link contrast exceed 4.5:1 in both themes; no browser console errors.

## Coursewide readability and answer feedback update

- Reviewed headings across all 672 teaching screens; corrected 28 display headings, including multi-term paragraphs and two broken eating-disorder table labels.
- Every definition and comparison item uses a separate shaded card (448 cards). Emphasis follows supplied terminology and source emphasis; long passages gain paragraph breaks without changing their words. Both the eight full paths and separate high-yield course use the shared presentation.
- All 750 question objects compare exactly with the pre-update data: stems, choices, keys, rationales, and source context are unchanged.
- Browser-rendered all 672 teaching screens and all 750 checks after the final change. Verified unchanged teaching/definition text, hidden feedback and answer colors before submission, every correct submission, every supplied rationale, no automatic advancement, and no duplicate correct-answer summary.
- Tested wrong answers and missed-check retries in all six formats, including mixed correct/wrong selections and unselected correct options. Labels and symbols accompany green/red colors.
- Verified selected answers, missed checks, saved location, and Continue studying after refresh. Storage key and scoring logic are unchanged.
- No horizontal overflow across all 1,422 screens at 320 × 720, 430 × 932, 932 × 430, 820 × 1180, and 1180 × 820 CSS pixels. Checked light and OLED dark appearance. These are browser viewport simulations, not physical-device Safari tests.
- No browser console errors. Source PDFs remain excluded.

## Copy-and-paste progress transfer

- Complete 150-lesson / 750-answer state round-trips in compressed and compatibility codes. Complete compressed fixture is about 8,040 characters; no question or teaching text is included.
- Tested drafts in all six formats, read/completed lessons, saved positions for all nine paths, missed checks, and active review with drafts or submitted feedback. Scores/completion are recalculated from original data on import.
- Tested merge, replacement, overlapping-answer precedence, missed-check reconciliation, malformed/partial/altered codes, line-wrapped codes, and storage-failure rollback.
- Browser-tested real clipboard copying and paste/import between separate localhost and 127.0.0.1 storage environments, preview before mutation, incomplete-code rejection, merge, replace, undo, refresh persistence, and resume into an unfinished review with feedback still hidden.
- Browser-tested manual-copy fallback, preview invalidation after editing the code, and blocked storage without changing active progress.
- Checked phone portrait/landscape, tablet, and 320px layouts, light and OLED dark mode; no horizontal overflow or console errors. These are browser simulations, not physical-device Safari or Apple Universal Clipboard tests.
- Clinical data, all checks/rationales, scoring, and the existing progress storage key remain unchanged. PDFs remain private.

## Restore the original presentation

- Restored the pre-redesign home cards, headings, path pages, compact lesson header, contextual Sources, and header theme control. The sole retained layout change moves copy-and-paste progress transfer below all nine paths.
- Clinical data, question presentation/scoring, transfer behavior, and the progress storage key are unchanged.

## Personal text highlighting

- Added saved highlights to teaching, definitions, explanations, questions, answer labels, and revealed rationales. Selection controls appear only when needed, at the bottom of the screen.
- Tested native text selection, spans across emphasized text, saving/removing, refresh persistence, Back/Next isolation, and definitions inside collapsed sections.
- Verified hidden feedback before submission, unchanged matching and single-choice scoring, and that tapping a highlight does not select an answer. Answer controls keep their accessible labels.
- Verified compressed and compatibility-code round trips, older codes without highlights, merge/deduplication, invalid-range rejection, persistence, and import undo. Browser export/import between separate local origins preserved highlights. Existing progress fixtures retained 18 completed lessons, 90 submitted checks, six missed checks, and the saved position.
- Checked light and OLED dark modes and 320, 430, 932, 834, and 1194px viewport widths. No horizontal overflow; toolbar buttons are at least 44px high. These are browser viewport tests, not physical iOS touch tests.
- Original course data remains unchanged: eight full paths plus high-yield review, 150 lessons and 750 checks. Personal highlights stay in browser storage and copied progress codes; no user data or PDFs are published.

## Clearer mistakes and omissions

- Green/check marks now mean a correct selection, red/crosses mean an incorrect selection, and amber/exclamation marks mean a required answer was missed. The same distinction applies to options, result summaries, and rationales.
- Matrix feedback marks each row and names the exact missing choices. The reported example now shows two of three rows correct and identifies Row 2's missing B (Functional effect). Correct rows stay compact.
- Checked feedback generation for all 750 checks across all six formats, including 834 valid incorrect-answer variations; no answer status appears before submission. Course data and scoring helpers are unchanged.
- Browser-tested the reported example, a wrong single-choice selection, hidden feedback, refresh persistence, and light/OLED dark appearance. Checked 320, 430, 932, 834, and 1194px widths without horizontal overflow. No browser console errors. These are browser viewport tests, not physical-device testing.

Home Screen highlighting update:
- Added a persistent Highlight action beside Sources in teaching and check cards. It captures the current selection before control interaction can clear it and provides a brief hint when no text is selected.
- Selection detection accepts paragraph-parent boundaries, clips to highlightable card content, and rechecks after touch, pointer, keyboard, and app-resume events.
- Browser-tested a full paragraph spanning normal and bold text, saving/removing highlights, navigation, and the manual fallback with selectionchange notifications deliberately suppressed. A simulated touch-end recovered the automatic toolbar with selectionchange suppressed.
- Refresh app requests fresh page HTML while retaining the current route and device storage; verified highlights and unfinished matching answers survive, rationales remain hidden before submission, and scoring still works afterward.
- Checked 1194px iPad layout, 430px phone layout, and 320px narrow layout in light/OLED dark modes. Controls remain at least 44px tall; no horizontal overflow or browser console errors. Physical iPad/iPhone Home Screen app behavior still requires device confirmation.

Highlight colors and text formatting:
- Added yellow, green, blue, and pink highlighting plus independent underline and strikethrough layers. The compact palette supports editing existing marks, partial recoloring, toggling a line style, and removing all formatting from a selected passage.
- Retained legacy yellow highlights and the existing progress-code format. Verified compressed and compatibility-code round trips, merging with incoming-color priority, partial erasure, style validation, and preservation of completed work and answers.
- Browser-tested selections spanning normal/bold text, overlapping styles, editing/removing marks, refresh persistence, keyboard access, and the persistent Highlight action with selectionchange deliberately suppressed.
- Verified formatting answer-choice text does not select its radio button or reveal feedback. Scoring and annotations remain intact after submitting an answer. All 750 checks across six formats and 834 incorrect-answer variations passed the existing feedback checks.
- Checked 320px and 430px phone layouts and 1194px iPad layout, light and OLED dark appearance, 44px tap targets, and unclipped palette labels. Text/background contrast for all eight theme/color combinations exceeds 4.5:1. No browser console errors. These are browser tests, not physical-device tests.

Separate colors and styles, including colored lines:
- Color swatches now choose a color without applying a fill. Separate Solid, Underline, and Strike actions apply that color to the selected style. Each overlapping style can keep an independent color.
- Preserved older yellow/colored highlights and uncolored lines. Validated partial line recoloring, per-style overlap resolution, independent line removal, strict color validation, and all eight colored-line variants through compressed and compatibility progress codes.
- Browser-tested color-only selection, solid fill, colored lines without fill, differently colored overlapping lines, toggling individual styles, refresh persistence, and the persistent Highlight action with selectionchange suppressed.
- Verified light/dark line colors, 320px and 430px phone layouts, 1194px iPad layout, and 44px controls without overflow or clipped labels. No browser console errors. Physical iOS Home Screen behavior is not simulated by these browser tests.

Text extraction and definition copyedit:
- Scanned the full and high-yield course data for unmatched parentheses/brackets, encoding artifacts, accidental repeated words, and split abbreviations. Reviewed all 448 definition/table cards against the original lesson data used for the supplied PDFs.
- Restored standalone punctuation and capitalization in 213 definition fields and 11 table-label/title fields, including NSSI, APSGN, VUR, EBV, IEP, ODD, CBT, ERP, CNS, and ESE. Corrected ATI/Meyers capitalization in 55 source headings. All 279 changed fields retain exactly the same letters and numbers when case and punctuation are excluded.
- Fixed the local conversion script to retain original punctuation and capitalization for verified terms and table cells instead of copying a matching phrase from a surrounding PDF sentence.
- Compared every question, answer key, and rationale with the previous release: all remain identical. All eight full paths, 137 full lessons, 13 high-yield lessons, 750 checks, lesson/step identifiers, and teaching paragraphs remain intact.
- Verified the corrected NSSI definition in the browser, navigation and saved step after refresh, and no console errors. Existing feedback/scoring checks for all six question formats and progress-code/annotation compatibility checks passed.

Oxford comma consistency:
- Reviewed serial lists across all eight full paths and the high-yield course, including headings, teaching, definitions, questions, rationales, source notes, and emphasis phrases. Corrected 507 text fields using explicitly reviewed lists; paired phrases such as “intake and output” remain intact.
- Verified every data change is comma-only. All 150 lessons, 750 checks, IDs, answer keys, numerical values, and literal source file names are unchanged.
- Saved text markings can reattach after punctuation edits when the passage is uniquely identifiable within its original block. Exact matches take priority; ambiguous or missing passages retain their original saved records rather than guessing. Tested 421 comma-edit anchors, color/style retention, and ambiguous/missing quotes.
- Browser-verified D-L17's corrected heading and paragraph, migration of a previously saved colored underline, persistence after Refresh app, removal of the test mark, and no console errors. Feedback checks passed for all 750 checks and 834 incorrect-answer variations; colored-marking and progress-code compatibility checks passed.


PDF word-spacing repair:
- Compared course text with the original lesson data, including exact text matches and 160 additional source fragments; scanned all 15,866 string fields for split-word candidates. Reviewed possible joins to retain legitimate phrases such as “a voiding trial” and “a febrile child.”
- Corrected 23 matrix-column labels across 18 lessons in six subject paths, including observation, mental-status, function, prevention/documentation, circulating-volume, and rehabilitation. These were spaces introduced by PDF line wrapping. Every course-data change removes only stray whitespace; words, punctuation, answer keys, lesson/question IDs, and all other fields remain identical.
- Updated the local PDF conversion script to restore source-verified word boundaries, with 27 regression cases including rejection of mismatched content. No dictionary-based runtime rewriting is used.
- Extended saved-marking reattachment to tolerate repaired spacing while retaining exact-match priority and refusing ambiguous matches. Tested 92 color/style cases, old underline migration in the browser, correct matrix scoring, and refresh persistence.
- Browser-checked all 23 repaired labels across the 18 affected checks at 430px width without overflow; inspected the reported mental-status case in OLED dark mode. No console errors. These are browser viewport tests, not physical-device Safari tests.
- Existing feedback checks passed for all 750 checks and 834 valid incorrect answers, along with colored-annotation and compressed/compatibility progress-code checks.
