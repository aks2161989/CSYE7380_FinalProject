import { useState } from "react";

const LOGO_DEV_PUBLIC_KEY = "pk_LBmLXMUXR82QrV3PCBB1Lw";

const companyDomains = {
  AAPL: "apple.com",
  BAC: "bankofamerica.com",
  AXP: "americanexpress.com",
  KO: "coca-cola.com",
  CVX: "chevron.com",
  OXY: "oxy.com",
  KHC: "kraftheinzcompany.com",
  MCO: "moodys.com",
  DVA: "davita.com",
  VRSN: "verisign.com",
};

const fallbackBg = {
  AAPL: "bg-black",
  BAC: "bg-[#cc0000]",
  AXP: "bg-[#016fd0]",
  KO: "bg-[#e61a27]",
  CVX: "bg-[#0054a6]",
  OXY: "bg-[#c41230]",
  KHC: "bg-[#1a3668]",
  MCO: "bg-[#5c2d91]",
  DVA: "bg-[#007a3d]",
  VRSN: "bg-[#005ea8]",
};

export default function CompanyLogo({ symbol }) {
  const [failed, setFailed] = useState(false);
  const domain = companyDomains[symbol];

  if (domain && !failed) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
        <img
          src={`https://img.logo.dev/${domain}?token=${LOGO_DEV_PUBLIC_KEY}&size=80&format=png`}
          alt={symbol}
          className="h-7 w-7 object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${fallbackBg[symbol] ?? "bg-slate-600"}`}>
      {symbol.slice(0, 2)}
    </div>
  );
}
