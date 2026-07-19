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

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? "";

export const LINKS = {
  twitter: process.env.NEXT_PUBLIC_TWITTER ?? "",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM ?? "",
  pons: process.env.NEXT_PUBLIC_PONS ?? "", // Pons launchpad listing
  chart: process.env.NEXT_PUBLIC_CHART ?? "", // dexscreener / chart
};
