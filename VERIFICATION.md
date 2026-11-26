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
