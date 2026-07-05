// Parser leve de user-agent — sem dependências externas.
// Cobre os casos que importam para relatórios de tráfego pago.

export type ParsedUA = {
  deviceType: "mobile" | "tablet" | "desktop";
  os: string;
  browser: string;
  isBot: boolean;
};

const BOT_PATTERN =
  /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pingdom|monitor/i;

export function parseUserAgent(ua: string | null): ParsedUA {
  const s = ua ?? "";

  const isBot = BOT_PATTERN.test(s);

  const isTablet = /iPad|Tablet|Nexus 7|Nexus 10/i.test(s);
  const isMobile = !isTablet && /Mobi|Android|iPhone|iPod/i.test(s);

  let os = "Outro";
  if (/Windows/i.test(s)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(s)) os = "iOS";
  else if (/Android/i.test(s)) os = "Android";
  else if (/Mac OS X/i.test(s)) os = "macOS";
  else if (/Linux/i.test(s)) os = "Linux";

  let browser = "Outro";
  if (/Instagram/i.test(s)) browser = "Instagram";
  else if (/FBAN|FBAV|FB_IAB/i.test(s)) browser = "Facebook";
  else if (/Edg\//i.test(s)) browser = "Edge";
  else if (/OPR\//i.test(s)) browser = "Opera";
  else if (/SamsungBrowser/i.test(s)) browser = "Samsung Internet";
  else if (/Chrome/i.test(s)) browser = "Chrome";
  else if (/Safari/i.test(s)) browser = "Safari";
  else if (/Firefox/i.test(s)) browser = "Firefox";

  return {
    deviceType: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
    os,
    browser,
    isBot,
  };
}
