# 👥 Adding Contributors with All Contributors

Use this guide to credit **code and non‑code** contributors in any GitHub repository.

---

## 1. One‑time setup

```bash
# Run in the repo root
npm install -g all-contributors-cli
npx all-contributors init

git add .all-contributorsrc README.md
git commit -m "docs: add All Contributors"
git push
```

This installs the CLI, creates the Contributors table in your `README.md`, and commits the config file.

> #### Prefer automation?
>
> Install the **All Contributors App** from the GitHub Marketplace and skip the global npm install. Steps&nbsp;2–4 below still apply.

---

## 2. Add people

### A. From your terminal (CLI)

```bash
npx all-contributors add <githubHandle> <contribution1> [contribution2...]
```

### B. From any issue or PR (bot comment)

```
@all-contributors please add <githubHandle> for <contribution1>, <contribution2>
```

#### Handy contribution types

| Key       | Recognises…        |
|-----------|--------------------|
| `code`    | source code        |
| `bug`     | bug reports        |
| `doc`     | documentation      |
| `ideas`   | planning / ideas   |
| `design`  | visual / UX design |
| `review`  | PR reviews         |

*Full list: <https://allcontributors.org/docs/en/emoji-key>*

---

## 3. Commit & push the changes

The CLI or bot edits your `README.md`. Commit the changes if needed:

```bash
git commit -am "docs: add @alice as contributor"
git push
```

---

## 4. Keeping the table current

- **Bot route**: Leave the bot comment; it creates a PR and merges if you allow it.
- **CLI route**: Re‑run the `add` command each time you want to credit someone.

---

## 5. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Table not updating | Ensure `.all-contributorsrc` exists and the CLI or Action ran. |
| Wrong avatar/link | Check the GitHub username spelling. |
| Need more roles | Use multiple contribution types; see the emoji key. |

---

Made with ❤️ using [all‑contributors](https://allcontributors.org)
