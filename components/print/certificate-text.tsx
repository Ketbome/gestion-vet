"use client";

import { useState } from "react";

export function CertificateText({ defaultText }: { defaultText: string }) {
  const [text, setText] = useState(defaultText);

  return (
    <div className="my-8 text-sm leading-relaxed">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full rounded-lg border border-gray-300 p-3 print:hidden"
      />
      <p className="hidden whitespace-pre-wrap print:block">{text}</p>
    </div>
  );
}
