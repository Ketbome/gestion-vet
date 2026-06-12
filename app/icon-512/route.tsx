import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(<IconMark />, {
    width: 512,
    height: 512,
  });
}

function IconMark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
      <rect width="48" height="48" rx="12" fill="#0d9488" />
      <circle cx="15" cy="15.5" r="4.2" fill="#fff" />
      <circle cx="24" cy="12" r="4.2" fill="#fff" />
      <circle cx="33" cy="15.5" r="4.2" fill="#fff" />
      <circle cx="9.5" cy="24.5" r="3.6" fill="#fff" />
      <circle cx="38.5" cy="24.5" r="3.6" fill="#fff" />
      <path
        d="M24 22c6.6 0 12 5 12 10.6 0 3.5-2.6 5.9-6 5.9-2.3 0-4.4-1-6-1s-3.7 1-6 1c-3.4 0-6-2.4-6-5.9C12 27 17.4 22 24 22Z"
        fill="#fff"
      />
      <path
        d="M22.4 26.5h3.2v3.1h3.1v3.2h-3.1v3.1h-3.2v-3.1h-3.1v-3.2h3.1v-3.1Z"
        fill="#0d9488"
      />
    </svg>
  );
}
