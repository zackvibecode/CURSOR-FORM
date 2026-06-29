import { cn } from "@/lib/utils";

const FLAG_MAP: Record<string, string> = {
  MY: "my",
  US: "us",
  ES: "es",
  FR: "fr",
  JP: "jp",
  KR: "kr",
  GB: "gb",
  DE: "de",
  CN: "cn",
  IN: "in",
  ID: "id",
  TH: "th",
  SG: "sg",
  AU: "au",
};

interface FlagIconProps {
  code: string;
  className?: string;
}

export function FlagIcon({ code, className }: FlagIconProps) {
  const cc = FLAG_MAP[code.toUpperCase()] ?? code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${cc}.png`}
      srcSet={`https://flagcdn.com/w80/${cc}.png 2x`}
      alt={`${code.toUpperCase()} flag`}
      className={cn("inline-block h-3.5 w-5 rounded-[2px] object-cover", className)}
      loading="lazy"
    />
  );
}
