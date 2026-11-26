# NUR2460 Exam 4 study website

[Open the study website](https://sleepyius.github.io/NUR2460-Exam-4-Path-Learning/) or open `index.html` locally to study. The site uses plain HTML, CSS, and JavaScript with relative paths and no build step, account, or external runtime dependencies.

## Publish on GitHub Pages

1. Create or choose a GitHub repository for the site.
2. Upload **the contents of this folder** to the repository's `main` branch. `index.html` must sit at the repository root beside `app.js`, `core.js`, `content.js`, `styles.css`, `favicon.svg`, and the `sources` folder. Keep `.nojekyll` if your upload method includes hidden files.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, then **main** and **/(root)**. Click **Save**.
5. Wait for deployment to finish. Open the website address shown in Pages settings. This repository’s address is `https://sleepyius.github.io/NUR2460-Exam-4-Path-Learning/`.

These steps follow [GitHub's publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Study and saved progress

- **Continue studying** returns to your saved step or current missed-check review.
- Press **Next** to mark a teaching step as read. A lesson is complete when every teaching step is read and all five checks have been attempted. Getting an answer wrong does not block lesson completion.
- Select an answer, then press **Check answer**. Matching and select-two questions require the complete exact answer; there is no partial-credit scoring. Feedback shows your choice, the correct answer, and the original rationale. Continue whenever you are ready.
- **Review missed checks** offers a fresh attempt. A correct retry removes the check from the missed list. An incorrect retry keeps it there.
- Every lesson is available from the home page. The lesson outline also lets you revisit individual teaching steps or the checks.
- Browser local storage keeps your place, draft selections, submitted answers, completed lessons, and missed checks on the current device. Progress does not sync between devices or browsers. Clearing site data or private browsing can remove it. Local-file previews and the published GitHub Pages address have separate storage.
- Source PDFs retain any marks in the supplied originals; those marks do not initialize website progress.

## Content and files

The high-yield PDF is the backbone: **8 subjects, 13 lessons, 65 checks**. Teaching is divided into **84 short screens**, including the bedside examples. There are **33 optional explanations** checked against the matching full paths. The 46 single-choice, 12 select-two, and 7 matching checks preserve their original wording, options, order, keys, and rationales. Relevant ATI–lecture differences remain visible in lessons.

- `index.html` — page shell; open this file or serve this folder.
- `styles.css` — responsive layout and large touch targets.
- `content.js` — lesson content and original checks.
- `core.js` — exact-answer scoring and saved-state validation.
- `app.js` — navigation, feedback, sources, and browser storage.
- `sources/` — the high-yield PDF and eight matching full paths, accessible through **Sources**.
- `VERIFICATION.md` — content and behavior verification record.

For a local HTTP preview, run `python3 -m http.server 8000` in this folder and open `http://localhost:8000/`. Keep the terminal running while previewing.
