# Original Certificate Creator

Design your organisation's own seals and stickers, issue certificates with them, and let anyone verify a certificate with its serial number or QR code.

## Features

- **Sticker Creator**: rosettes, serrated seals, shields, stars, banner badges and holographic seals in gold, silver, bronze, holographic or flat colour. Each has micro-text, guilloché lines and ribbons, and you can upload your own logo for the centre. Download as PNG or SVG.
- **Certificate Creator**: four templates (classic, modern, elegant, minimal). **Auto-place** puts stickers in the standard sections (main seal between date and signature, holographic seal top-right, small seal by the signature); drag to adjust. Optional faint sticker pattern across the whole certificate.
- **Automatic verification**: scan the QR with any phone camera or the in-app scanner. Every certificate gets a unique serial (`OC-YYYY-XXXX-XXXX`) and a QR code linking to `/verify/<serial>`. Revoked certificates show as revoked.
- **Download**: full-colour A4 PDF or high-resolution PNG.
- **Admin PIN login**: only the admin (PIN from `ADMIN_PIN`, 5 tries then 15-minute lock) can create, update and delete stickers and certificates.
- **Installable app (PWA)**: the *Install app* button at the top works on Windows, Mac, Android, iPhone and iPad.

Only use your own organisation's name, logo and seals. This tool is for issuing your own certificates, not for copying other organisations' certificates or security stickers.

## Run locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_PIN and AUTH_SECRET
npm run dev
```

Open http://localhost:3000 and sign in at `/login` with your PIN. Data is saved in `./.data`.

## Deploy on Vercel

1. Import the GitHub repo in Vercel.
2. **Storage → Create → Blob**, connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`.
3. **Settings → Environment Variables**: add `ADMIN_PIN` and `AUTH_SECRET`.
4. Redeploy.
