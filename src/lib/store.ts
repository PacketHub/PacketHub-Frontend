import { ForumPost } from "./types";

const STORAGE_KEY = "packethub-posts";

const SEED_POSTS: ForumPost[] = [
  {
    id: "1",
    title: "How do I set up a home network with VLANs?",
    content: "I recently bought a managed switch and I want to separate my IoT devices from my main network using VLANs. I'm running a TP-Link managed switch and a pfSense router. Can anyone walk me through the basic steps?\n\nI've looked at some guides but they seem to assume a lot of prior knowledge. Any beginner-friendly resources would be appreciated too!",
    category: "networking",
    author: "NetNewbie42",
    createdAt: new Date("2026-03-24T10:30:00"),
  },
  {
    id: "2",
    title: "Best budget GPU for 1080p gaming in 2026?",
    content: "Looking to build my first PC and I'm on a tight budget. What GPU would you recommend for 1080p gaming at medium-high settings? My budget for the GPU alone is around $200.\n\nI mostly play games like Valorant, CS2, and some AAA titles. Would love to hear your recommendations!",
    category: "hardware",
    author: "FirstBuildAndy",
    createdAt: new Date("2026-03-23T15:45:00"),
  },
  {
    id: "3",
    title: "Python vs JavaScript for a first programming language?",
    content: "I'm a complete beginner wanting to learn programming. I keep hearing that both Python and JavaScript are great first languages. What are the pros and cons of each?\n\nI'm interested in both web development and data analysis, so I'm not sure which path to start with. Any advice from people who've learned both?",
    category: "programming",
    author: "CodeStarter",
    createdAt: new Date("2026-03-22T09:15:00"),
  },
  {
    id: "4",
    title: "Windows 11 TPM 2.0 requirement bypass - is it safe?",
    content: "My laptop doesn't have TPM 2.0 but I want to upgrade to Windows 11. I've seen registry hacks to bypass this requirement. Is it safe to do this? Will I still receive Windows updates?\n\nThe laptop is a ThinkPad T460 with an i5-6300U. It works great with Windows 10 but support is ending soon.",
    category: "os",
    author: "ThinkPadFan",
    createdAt: new Date("2026-03-21T14:20:00"),
  },
  {
    id: "5",
    title: "Safe DDR5 overclocking voltages for daily use?",
    content: "I just got some DDR5-6000 CL30 sticks and I want to push them a bit further. What voltages are considered safe for 24/7 use? I've heard anything under 1.4V should be fine but I want to make sure.\n\nRunning them on an ASUS Z790 board with a 13700K. Currently stable at XMP profile.",
    category: "overclocking",
    author: "OCenthusiast",
    createdAt: new Date("2026-03-20T18:00:00"),
  },
  {
    id: "6",
    title: "Hackintosh on Ryzen 7 7800X3D - compatible?",
    content: "Has anyone successfully set up a Hackintosh with the Ryzen 7 7800X3D? I'm using an ASRock B650 board and an RX 6800 XT. I've been reading the OpenCore guide but wanted to check if there are any known issues with this specific CPU.\n\nPlanning to dual-boot with Windows for gaming.",
    category: "hackintosh",
    author: "MacOnPC",
    createdAt: new Date("2026-03-19T11:30:00"),
  },
  {
    id: "7",
    title: "How to update BIOS without a CPU installed?",
    content: "I bought a B650 motherboard that needs a BIOS update to support my Ryzen 9000 series CPU. The board has a BIOS flashback button. Can someone explain the exact steps to flash the BIOS using just a USB drive?\n\nThis is my first build and I'm nervous about bricking the board.",
    category: "bios",
    author: "FirstTimer",
    createdAt: new Date("2026-03-18T16:45:00"),
  },
  {
    id: "8",
    title: "PC randomly freezes and reboots - how to diagnose?",
    content: "My PC has been randomly freezing and rebooting for the past week. No blue screen, just a sudden restart. I've checked temperatures and they seem fine (CPU max 72°C, GPU max 78°C).\n\nSpecs: Ryzen 5 5600X, RTX 3060 Ti, 16GB DDR4, 750W PSU. I've run MemTest86 with no errors. What else should I check?",
    category: "troubleshooting",
    author: "HelpMePlz",
    createdAt: new Date("2026-03-17T20:10:00"),
  },
];

export function getPosts(): ForumPost[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_POSTS));
    return SEED_POSTS;
  }
  const posts = JSON.parse(stored) as ForumPost[];
  return posts.map((p) => ({ ...p, createdAt: new Date(p.createdAt) }));
}

export function getPost(id: string): ForumPost | undefined {
  return getPosts().find((p) => p.id === id);
}

export function createPost(post: Omit<ForumPost, "id" | "createdAt">): ForumPost {
  const posts = getPosts();
  const newPost: ForumPost = {
    ...post,
    id: Date.now().toString(),
    createdAt: new Date(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newPost, ...posts]));
  return newPost;
}

export function updatePost(id: string, data: Partial<Omit<ForumPost, "id" | "createdAt">>): ForumPost | undefined {
  const posts = getPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  posts[idx] = { ...posts[idx], ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return posts[idx];
}

export function deletePost(id: string): boolean {
  const posts = getPosts();
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length === posts.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}
