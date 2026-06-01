"use client";

import { useState, useRef, DragEvent } from "react";
import { useMedia, MediaFolder } from "@/store/media-context";
import { useToast } from "@/hooks/use-toast";
import { Upload, Copy, Trash2, Check } from "lucide-react";

const FOLDERS: { id: MediaFolder; label: string }[] = [
  { id: "all", label: "All Media" },
  { id: "articles", label: "Articles" },
  { id: "columnists", label: "Columnists" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "logos", label: "Logos" },
];

export default function AdminMedia() {
  const { items, addFromFile, deleteItem, moveItem, formatBytes } = useMedia();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeFolder, setActiveFolder] = useState<MediaFolder>("all");
  const [dragging, setDragging] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const uploadFolder: Exclude<MediaFolder, "all"> =
    activeFolder === "all" ? "articles" : activeFolder;

  const filtered =
    activeFolder === "all"
      ? items
      : items.filter((i) => i.folder === activeFolder);

  const selected = items.find((i) => i.id === selectedId);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    let count = 0;
    for (const file of Array.from(files)) {
      try {
        await addFromFile(file, uploadFolder);
        count++;
      } catch {
        toast({
          title: "Upload failed",
          description: `${file.name} is not a supported image.`,
          variant: "destructive",
        });
      }
    }
    if (count > 0) {
      toast({
        title: "Upload complete",
        description: `${count} file${count === 1 ? "" : "s"} added to ${uploadFolder}.`,
      });
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function copyUrl(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(
        url.startsWith("data:") ? url.slice(0, 80) + "…" : window.location.origin + url,
      );
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "URL copied", description: "Paste into an article or ad unit." });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not access clipboard.",
        variant: "destructive",
      });
    }
  }

  function confirmDelete() {
    if (!deleteId) return;
    deleteItem(deleteId);
    if (selectedId === deleteId) setSelectedId(null);
    setDeleteId(null);
    toast({ title: "Deleted", description: "Media file removed from library." });
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      <header className="flex items-center justify-between border-b border-border pb-6 shrink-0">
        <div>
          <h1 className="font-serif text-[32px] font-bold text-foreground">
            Media Library
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {filtered.length} file{filtered.length !== 1 ? "s" : ""} in library
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#C41E3A] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-widest hover:bg-[#A01830] transition-colors"
        >
          Upload Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-[240px] bg-white dark:bg-[#1A1A18] border border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border bg-[#F5F5F3] dark:bg-[#111111]">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Folders
            </h2>
          </div>
          <div className="flex flex-col py-2">
            {FOLDERS.map((folder) => {
              const count =
                folder.id === "all"
                  ? items.length
                  : items.filter((i) => i.folder === folder.id).length;
              const active = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setActiveFolder(folder.id);
                    setSelectedId(null);
                  }}
                  className={`px-6 py-3 text-left text-[13px] font-medium border-l-2 transition-colors flex justify-between gap-2 ${
                    active
                      ? "border-[#C41E3A] bg-[#FAFAF8] dark:bg-[#111111] text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-[#FAFAF8] dark:hover:bg-[#111111]"
                  }`}
                >
                  <span>{folder.label}</span>
                  <span className="text-[11px] text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-[#1A1A18] border border-border flex flex-col min-w-0">
          <div className="p-6 border-b border-border bg-[#FAFAF8] dark:bg-[#0A0A09]">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`border border-dashed py-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragging
                  ? "border-[#C41E3A] bg-[#C41E3A]/5"
                  : "border-border hover:border-primary"
              }`}
            >
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-[14px] font-bold">Drop files to upload</span>
              <span className="text-[12px] text-muted-foreground mt-2">
                or click to browse · saves to{" "}
                <strong className="text-foreground">{uploadFolder}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6">
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground text-[14px] py-12">
                  No files in this folder. Upload images to get started.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`flex flex-col text-left group ${
                        selectedId === item.id ? "ring-2 ring-[#C41E3A]" : ""
                      }`}
                    >
                      <div className="aspect-square bg-muted border border-border mb-2 relative overflow-hidden group-hover:border-primary transition-colors">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[12px] font-medium truncate text-foreground group-hover:text-[#C41E3A]">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-1">
                        {formatBytes(item.size)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <aside className="w-[260px] shrink-0 border-l border-border p-5 flex flex-col gap-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  File details
                </h3>
                <div className="aspect-video bg-muted border border-border overflow-hidden">
                  <img
                    src={selected.url}
                    alt={selected.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[13px] font-medium break-all">{selected.name}</p>
                <p className="text-[12px] text-muted-foreground">
                  {formatBytes(selected.size)} · {selected.folder}
                </p>

                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Move to folder
                </label>
                <select
                  value={selected.folder}
                  onChange={(e) =>
                    moveItem(
                      selected.id,
                      e.target.value as Exclude<MediaFolder, "all">,
                    )
                  }
                  className="input text-[12px]"
                >
                  {FOLDERS.filter((f) => f.id !== "all").map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => copyUrl(selected.url, selected.id)}
                  className="flex items-center justify-center gap-2 w-full py-2 border border-border text-[11px] font-bold uppercase tracking-wider hover:border-foreground transition-colors"
                >
                  {copiedId === selected.id ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(selected.id)}
                  className="flex items-center justify-center gap-2 w-full py-2 border border-border text-[11px] font-bold uppercase tracking-wider text-[#C41E3A] hover:border-[#C41E3A] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </aside>
            )}
          </div>
        </div>
      </div>

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white dark:bg-[#1A1A18] border border-border w-full max-w-sm p-8 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-[20px] font-bold">Delete file?</h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              This removes the file from your media library. Articles already using
              it will keep their current image until you change them.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 text-[12px] font-bold uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 text-[12px] font-bold uppercase tracking-widest bg-[#C41E3A] text-white hover:bg-[#A01830] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
