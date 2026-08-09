nisiare/nisiare.github.io

This repository hosts a small personal site with separate pages for Blog, Habits, and Trackers. The site is designed in a nostalgic early-2000s style and is static — pages are HTML/CSS/JS.

How the blog is global

- The Blog page reads markdown files from the `posts/` folder in this repository using the GitHub Contents API. Any markdown file placed in `posts/` is publicly visible on the blog page.
- To publish a post you can:
  - Add a markdown file via the GitHub web UI at `posts/YYYY-MM-DD-title.md` (recommended)
  - Or use the optional "Create Post (PR)" form on the Blog page to create a branch and open a Pull Request (requires a Personal Access Token with repo access). The form does not store the token — it is sent directly to GitHub and used to create the PR.

Habits

- The Habits page provides a calendar-style interface. Habit checks and daily todos are stored locally in your browser (localStorage). This keeps personal habit data private to your device.

Trackers

- The Trackers page lets you create counters and note-style trackers for manual tracking (e.g., WoW progress). Trackers are stored locally.

Publishing with GitHub Pages

Because this repository is named `nisiare.github.io`, enable Pages in repository Settings → Pages, choose Branch: `main` and Folder: `/` (root). The site will be available at https://nisiare.github.io/

Security note about the PR form

- The PR form requires a GitHub token to create branches/files and open a Pull Request. Only use short-lived tokens you create for this purpose and delete them afterward. Do not share tokens publicly.

If you want additional changes (export/import UI, service-worker notifications, or server-backed habit syncing) tell me which and I will add them.
