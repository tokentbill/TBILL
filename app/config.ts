// ============================================================
//  $TBILL SITE CONFIG
// ============================================================
//  Empty until launch. While empty, the CA and social links
//  simply DO NOT render — no placeholders, no dead links.
//
//  AFTER LAUNCH, drop in the real values (then redeploy):
//   - In code: paste them between the quotes below, OR
//   - No code: set these env vars in the Vercel dashboard
//     (Settings → Environment Variables) then hit Redeploy:
//       NEXT_PUBLIC_CA, NEXT_PUBLIC_TWITTER, NEXT_PUBLIC_TELEGRAM,
//       NEXT_PUBLIC_PONS, NEXT_PUBLIC_CHART
// ============================================================

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CA ?? "0xbc08574BD0D64836f17e5e7013018E9A0b4A4693";

export const LINKS = {
  twitter: process.env.NEXT_PUBLIC_TWITTER ?? "https://x.com/TBILLonRH",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM ?? "",
  pons:
    process.env.NEXT_PUBLIC_PONS ??
    "https://ponsfamily.com/launchpad/0xbc08574bd0d64836f17e5e7013018e9a0b4a4693", // Pons launchpad listing
  chart: process.env.NEXT_PUBLIC_CHART ?? "", // dexscreener / chart
};
