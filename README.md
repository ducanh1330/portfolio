# Alex Doan — Portfolio

Personal portfolio site for Duy Duc Anh Doan (Alex Doan), an entry-level software
engineer based in Melbourne, VIC.

**Live site:** https://ducanh1330.github.io/portfolio/

## Contents

- Hero with scroll-pinned capability pillars (AI & RAG systems, full-stack, workflow automation)
- Skills, completed UTS coursework, and work experience
- Project carousel linking through to a detail page per GitHub repository

## Stack

Plain static HTML, CSS, and vanilla JavaScript — no build step or framework.

- **GSAP + ScrollTrigger** for the pinned hero and scroll-driven pillar sequence
- **Lenis** for smooth scrolling
- **Google Fonts** — Anton (display), Space Grotesk (body), IBM Plex Mono (labels)

All three libraries load from a CDN, so the repository itself is dependency-free
for deployment.

## Local development

```bash
npm install          # only needed for the screenshot tool
node serve.mjs       # serves the site at http://localhost:3000
```

`screenshot.mjs` is a Puppeteer helper used during development:

```bash
node screenshot.mjs http://localhost:3000 label
```

Neither script is required to deploy — the site is served as static files.

## Structure

```
index.html          # single-page site
styles/main.css     # design tokens and all styling
scripts/main.js     # preloader, hero scroll animation, carousel
projects/*.html     # one detail page per project
photo/              # avatar and employer logos
```
