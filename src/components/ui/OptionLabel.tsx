import { parseOptionFlag } from "@/lib/option-flag";
import { FlagIcon } from "@/components/ui/FlagIcon";

export function OptionLabel({ option }: { option: string }) {
  const parsed = parseOptionFlag(option);

  if (!parsed) {
    return <>{option}</>;
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <FlagIcon code={parsed.code} className="h-3.5 w-5 shrink-0" />
      <span>{parsed.label}</span>
    </span>
  );
}
