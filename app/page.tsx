import Link from "next/link";
import LandingStickers from "@/components/LandingStickers";

const FEATURES = [
  { t: "Sticker Creator", d: "Design gold rosettes, holographic seals, shields and badges, or upload your own logo to make one." },
  { t: "Certificate Creator", d: "Four premium templates. Stickers go into the right sections automatically, and you can drag them anywhere." },
  { t: "Security pattern", d: "Cover the whole certificate with a faint repeating pattern of your seal that is hard to copy." },
  { t: "Verification QR", d: "Every certificate gets a unique serial number and QR code that opens a public verification page." },
  { t: "Full-colour PDF", d: "Download print-ready A4 PDF or high-resolution PNG in original colour." },
  { t: "Install anywhere", d: "Install on Windows, Mac, iPhone, iPad and Android straight from the browser." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-4 inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
            Seals · Stickers · Verifiable certificates
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Create <span className="gold-text">original</span> certificates with your own seals
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Design your organisation&apos;s stickers, issue beautiful certificates and let anyone confirm they are
            genuine with a scan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admin/certificates/new" className="btn-gold px-6 py-3 text-base">
              Create a certificate
            </Link>
            <Link href="/admin/stickers/new" className="btn-ghost px-6 py-3 text-base">
              Create a sticker
            </Link>
            <Link href="/verify" className="btn-ghost px-6 py-3 text-base">
              Verify a certificate
            </Link>
          </div>
        </div>
        <LandingStickers />
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.t} className="card p-6">
            <h3 className="font-semibold text-amber-200">{f.t}</h3>
            <p className="mt-2 text-sm text-slate-400">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
