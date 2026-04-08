# NeuroAI Initiative

Static landing page for the NeuroAI Initiative, a NeuroNYC project.

Built as a single-page static site: `index.html` + `styles.css`. No build step, no dependencies, GitHub Pages-ready.

---

## Local preview

Open the file directly in your browser:

```
open index.html
```

Or drag `index.html` into any browser window. No local server needed.

---

## Deploy to GitHub Pages

### 1. Initialize git

```bash
cd /path/to/neuroai-initiative
git init
git add .
git commit -m "Initial commit"
```

### 2. Create a GitHub repository

Go to [github.com/new](https://github.com/new) and create a new repository (e.g. `neuroai-initiative`). Leave it empty — no README, no .gitignore.

### 3. Connect and push

```bash
git remote add origin https://github.com/YOUR-USERNAME/neuroai-initiative.git
git branch -M main
git push -u origin main
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Branch**, select `main` and `/ (root)`, then click **Save**
4. GitHub will publish the site — the URL will appear at the top of the Pages settings (typically `https://YOUR-USERNAME.github.io/neuroai-initiative/`)

Allow a minute or two for the first deploy.

---

## Updating the placeholder link

The **Register interest** button links to `https://forms.gle/placeholder`. Replace this in `index.html`:

```html
<a href="https://forms.gle/YOUR-REAL-FORM-ID" class="cta-button" ...>
```

---

## File structure

```
neuroai-initiative/
├── index.html
├── styles.css
└── README.md
```
