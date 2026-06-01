"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";

export type MediaFolder =
  | "all"
  | "articles"
  | "columnists"
  | "lifestyle"
  | "logos";

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  folder: Exclude<MediaFolder, "all">;
  size: number;
  createdAt: number;
}

const STORAGE_KEY = "pdn_media";
const STORAGE_VERSION = "v1";
const VERSION_KEY = "pdn_media_version";

const seedMedia: MediaItem[] = [
  { id: "seed-hero-1", name: "hero-1.svg", url: "/images/hero-1.svg", folder: "articles", size: 0, createdAt: 0 },
  { id: "seed-hero-2", name: "hero-2.svg", url: "/images/hero-2.svg", folder: "articles", size: 0, createdAt: 0 },
  { id: "seed-hero-3", name: "hero-3.svg", url: "/images/hero-3.svg", folder: "articles", size: 0, createdAt: 0 },
  { id: "seed-life-1", name: "life-1.svg", url: "/images/life-1.svg", folder: "lifestyle", size: 0, createdAt: 0 },
  { id: "seed-life-2", name: "life-2.svg", url: "/images/life-2.svg", folder: "lifestyle", size: 0, createdAt: 0 },
  { id: "seed-col-1", name: "col-1.svg", url: "/images/col-1.svg", folder: "columnists", size: 0, createdAt: 0 },
  { id: "seed-col-2", name: "col-2.svg", url: "/images/col-2.svg", folder: "columnists", size: 0, createdAt: 0 },
  { id: "seed-home-ad", name: "home-ad-banner.svg", url: "/images/home-ad-banner.svg", folder: "logos", size: 0, createdAt: 0 },
  { id: "seed-article-ad", name: "article-ad-banner.svg", url: "/images/article-ad-banner.svg", folder: "logos", size: 0, createdAt: 0 },
];

function loadMedia(): MediaItem[] {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    if (version !== STORAGE_VERSION) {
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMedia));
      return seedMedia;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as MediaItem[];
  } catch {
    /* ignore */
  }
  return seedMedia;
}

function saveMedia(items: MediaItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MediaContextType {
  items: MediaItem[];
  addFromFile: (file: File, folder: Exclude<MediaFolder, "all">) => Promise<MediaItem>;
  deleteItem: (id: string) => void;
  moveItem: (id: string, folder: Exclude<MediaFolder, "all">) => void;
  formatBytes: (bytes: number) => string;
}

const MediaContext = createContext<MediaContextType | null>(null);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MediaItem[]>(seedMedia);
  const hydrated = useRef(false);

  useEffect(() => {
    setItems(loadMedia());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveMedia(items);
  }, [items]);

  const addFromFile = useCallback(
    (file: File, folder: Exclude<MediaFolder, "all">) =>
      new Promise<MediaItem>((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
          reject(new Error("Only image files are supported"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const item: MediaItem = {
            id: String(Date.now()),
            name: file.name,
            url: reader.result as string,
            folder,
            size: file.size,
            createdAt: Date.now(),
          };
          setItems((prev) => [item, ...prev]);
          resolve(item);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      }),
    [],
  );

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function moveItem(id: string, folder: Exclude<MediaFolder, "all">) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, folder } : i)),
    );
  }

  return (
    <MediaContext.Provider
      value={{ items, addFromFile, deleteItem, moveItem, formatBytes }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia must be used inside MediaProvider");
  return ctx;
}
