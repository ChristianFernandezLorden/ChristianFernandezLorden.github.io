# Personal site

A small Jekyll site for GitHub Pages: research, talks and notes. GitHub builds it for you on every push, so there is nothing to install.

## Put it online

1. Create a public repository named `USERNAME.github.io` (with your GitHub username).
2. Push the contents of this folder to it:

   ```sh
   git init -b main
   git add .
   git commit -m "First version"
   git remote add origin https://github.com/USERNAME/USERNAME.github.io.git
   git push -u origin main
   ```

3. In the repository, open **Settings → Pages** and check that the source is **Deploy from a branch**, branch `main`, folder `/ (root)`.

The site appears at `https://USERNAME.github.io` a minute or two later.

If you use another repository name, the site lives at `https://USERNAME.github.io/repository-name`, and you must set `baseurl: "/repository-name"` in `_config.yml`.

## First things to edit

| What | Where |
| --- | --- |
| Name, description, email, GitHub, Scholar, ORCID, CV | `_config.yml` |
| Home page text | `index.md` |
| About page | `about.md` |
| Research themes (the text above the paper list) | `research.md` |
| Papers | `_data/publications.yml` |
| Talks and posters | `_data/talks.yml` |
| Links in the header | `_data/nav.yml` |
| Colours, fonts, column width | the "Tokens" block at the top of `assets/css/main.css` |

The papers and talks that ship with the site are examples. So are the two PDF files in `assets/papers/` and `assets/slides/`.

## Add a paper

Add an entry to `_data/publications.yml`. The fields are described at the top of that file. Put the PDF in `assets/papers/` and point `pdf:` at it. Set `selected: true` to show the paper on the home page as well.

## Add a talk

Put the slides in `assets/slides/` and add an entry to `_data/talks.yml`.

## Write a note

Create a file in `_posts/` named `YYYY-MM-DD-some-title.md`:

```markdown
---
title: Some title
summary: One sentence shown in the list of notes.
tags: [control]
---

Text in Markdown. Inline math is written $$x^2$$, and a displayed equation is

$$
\dot x = f(x, u).
$$
```

- Math uses `$$ ... $$` both inline and on its own lines (this is how kramdown, the Markdown engine of GitHub Pages, does it). MathJax renders it. Numbered equations and `\label` / `\eqref` work.
- Code blocks use three backticks followed by the language (`julia`, `matlab`, `python`, ...).
- Images go in `assets/img/` and are included with `![Description]({{ '/assets/img/file.png' | relative_url }})`.
- A note with no equations can add `math: false` to skip loading MathJax.
- A note dated in the future is not published until that day.

## Add a page

Create `something.md` at the top level:

```markdown
---
layout: page
title: Teaching
permalink: /teaching/
---

Text in Markdown.
```

Then add it to `_data/nav.yml` if it should appear in the header.

## Preview on your computer (optional)

With Ruby installed:

```sh
bundle install
bundle exec jekyll serve
```

and open <http://localhost:4000>.

## What is where

```
_config.yml        site settings
index.md           home page text
research.md        text of the Research page
talks.md           text of the Talks page
notes.md           text of the Notes page
about.md           About page
_data/             papers, talks and header links (YAML)
_posts/            notes (Markdown)
_layouts/          page templates
_includes/         template pieces (header, footer, one paper, one talk, ...)
assets/css/        the stylesheet
assets/js/         trace.js (the neuron on the home page), site.js (dark mode switch)
assets/fonts/      the two typefaces, with their licences
assets/papers/     PDFs of papers
assets/slides/     PDFs of slides
```

## Good to know

- The line on the home page is a FitzHugh–Nagumo model integrated in the browser (`assets/js/trace.js`). It only animates while a spike is on screen. To remove it, delete the `{% include trace.html %}` line in `_layouts/home.html`.
- The site follows the visitor's light or dark setting. The switch in the footer overrides it.
- An RSS feed of the notes is at `/feed.xml`.
- The fonts (STIX Two Text and IBM Plex Sans) are stored in the repository, so the site makes no request to a font service. Both are under the SIL Open Font License. MathJax is the only thing loaded from elsewhere (the jsDelivr CDN), and only on notes.
