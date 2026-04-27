import { Category, CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryColorClasses: Record<Category, string> = {
  networking: "bg-category-networking/15 text-category-networking border-category-networking/30",
  hardware: "bg-category-hardware/15 text-category-hardware border-category-hardware/30",
  programming: "bg-category-programming/15 text-category-programming border-category-programming/30",
  os: "bg-category-os/15 text-category-os border-category-os/30",
  overclocking: "bg-category-overclocking/15 text-category-overclocking border-category-overclocking/30",
  hackintosh: "bg-category-hackintosh/15 text-category-hackintosh border-category-hackintosh/30",
  bios: "bg-category-bios/15 text-category-bios border-category-bios/30",
  troubleshooting: "bg-category-troubleshooting/15 text-category-troubleshooting border-category-troubleshooting/30",
};

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

const CategoryBadge = ({ category, className }: CategoryBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-display text-xs font-medium",
        categoryColorClasses[category],
        className
      )}
    >
      <span>{CATEGORY_ICONS[category]}</span>
      {CATEGORY_LABELS[category]}
    </span>
  );
};

export default CategoryBadge;
