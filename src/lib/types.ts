export type Category =
  | "networking"
  | "hardware"
  | "programming"
  | "os"
  | "overclocking"
  | "hackintosh"
  | "bios"
  | "troubleshooting";

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: Category;
  author: string;
  createdAt: Date;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  networking: "Networking",
  hardware: "Hardware",
  programming: "Programming",
  os: "Operating Systems",
  overclocking: "Overclocking",
  hackintosh: "Hackintosh",
  bios: "BIOS / Firmware",
  troubleshooting: "Troubleshooting",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  networking: "🌐",
  hardware: "🖥️",
  programming: "💻",
  os: "🪟",
  overclocking: "🔥",
  hackintosh: "🍎",
  bios: "⚙️",
  troubleshooting: "🔧",
};
