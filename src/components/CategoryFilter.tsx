import { Category, CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: Category[] = [
  "networking",
  "hardware",
  "programming",
  "os",
  "overclocking",
  "hackintosh",
  "bios",
  "troubleshooting",
];

interface CategoryFilterProps {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
}

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "rounded-full px-3 py-1.5 font-display text-xs font-medium transition-all",
          selected === null
            ? "glass border-primary/50 text-primary"
            : "glass-subtle text-muted-foreground hover:border-primary/40 hover:text-foreground"
        )}
      >
        All Topics
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat === selected ? null : cat)}
          className={cn(
            "rounded-full px-3 py-1.5 font-display text-xs font-medium transition-all",
            selected === cat
              ? "glass border-primary/50 text-primary"
              : "glass-subtle text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
