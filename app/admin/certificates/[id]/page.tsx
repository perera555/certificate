"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Certificate } from "@/lib/types";
import CertificateEditor from "@/components/CertificateEditor";

export default function EditCertificatePage({ params }: PageProps<"/admin/certificates/[id]">) {
  const { id } = use(params);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Certificate>(`/api/certificates/${id}`).then(setCert).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="mx-auto max-w-7xl px-4 py-8 text-red-300">{error}</p>;
  if (!cert) return <p className="mx-auto max-w-7xl px-4 py-8 text-slate-400">Loading…</p>;
  return <CertificateEditor key={cert.id} initial={cert} />;
}
