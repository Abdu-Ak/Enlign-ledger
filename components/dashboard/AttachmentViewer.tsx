"use client";
import React from "react";
import { Download, X, FileText, FileSpreadsheet, File, Loader2 } from "lucide-react";

interface Props {
  src: string;
  onClose: () => void;
}

const isImage = (src: string): boolean => {
  if (src.startsWith("data:image/")) return true;
  try {
    const url = new URL(src);
    const pathname = url.pathname.toLowerCase();
    return (
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".webp") ||
      pathname.endsWith(".gif") ||
      pathname.endsWith(".svg")
    );
  } catch {
    const cleanSrc = src.split("?")[0].toLowerCase();
    return (
      cleanSrc.endsWith(".jpg") ||
      cleanSrc.endsWith(".jpeg") ||
      cleanSrc.endsWith(".png") ||
      cleanSrc.endsWith(".webp") ||
      cleanSrc.endsWith(".gif") ||
      cleanSrc.endsWith(".svg")
    );
  }
};

const getFileNameAndExtension = (src: string) => {
  if (src.startsWith("data:")) {
    const match = src.match(/^data:([^;]+);/);
    const mime = match ? match[1] : "";
    if (mime === "application/pdf") return { name: "Document.pdf", ext: "pdf" };
    if (mime.startsWith("text/csv")) return { name: "Document.csv", ext: "csv" };
    const ext = mime.split("/")[1] || "file";
    return { name: `Attachment.${ext}`, ext };
  }
  try {
    const url = new URL(src);
    const pathname = decodeURIComponent(url.pathname);
    const parts = pathname.split("/");
    const filename = parts[parts.length - 1] || "attachment";
    const extMatch = filename.match(/\.([^.]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "file";
    return { name: filename, ext };
  } catch {
    const parts = src.split("?")[0].split("/");
    const filename = parts[parts.length - 1] || "attachment";
    const extMatch = filename.match(/\.([^.]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "file";
    return { name: filename, ext };
  }
};

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);

/**
 * Old records uploaded PDFs/docs under /image/upload/ because Cloudinary's
 * 'auto' resource_type mis-classified them. Rewrite those URLs to /raw/upload/
 * so they resolve correctly. Images are left untouched.
 */
const normalizeCloudinaryUrl = (src: string): string => {
  if (src.startsWith("data:") || !src.includes("cloudinary.com")) return src;
  try {
    const url = new URL(src);
    const ext = url.pathname.split(".").pop()?.toLowerCase() ?? "";
    if (!IMAGE_EXTS.has(ext) && url.pathname.includes("/image/upload/")) {
      url.pathname = url.pathname.replace("/image/upload/", "/raw/upload/");
      return url.toString();
    }
  } catch { /* not a valid URL — return as-is */ }
  return src;
};

export default function AttachmentViewer({ src, onClose }: Props) {
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Patch legacy /image/upload/ Cloudinary URLs for non-image files
  const effectiveSrc = normalizeCloudinaryUrl(src);
  const isImg = isImage(effectiveSrc);
  const fileInfo = getFileNameAndExtension(effectiveSrc);

  /** Fetch the file as a blob and trigger a real browser download.
   *  This bypasses the cross-origin restriction that makes the native
   *  <a download> attribute silently open the link instead of saving. */
  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Route through our server-side proxy to avoid CORS and to fix
      // legacy Cloudinary /image/upload/ PDF URLs that browsers can't download.
      const proxyUrl =
        `/api/download?url=${encodeURIComponent(effectiveSrc)}` +
        `&name=${encodeURIComponent(fileInfo.name)}`;

      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Download proxy returned ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileInfo.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Last-resort fallback: open the URL directly in a new tab
      window.open(effectiveSrc, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(6px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-3xl flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-4">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-base)" }}
            >
              Receipt Preview
            </span>
            <button
              onClick={handleDownload}
              disabled={downloading}
              title="Download receipt"
              className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                background: "var(--surface-2)",
                cursor: downloading ? "wait" : "pointer",
              }}
            >
              {downloading
                ? <Loader2 className="h-3.5 w-3.5 spin" />
                : <Download className="h-3.5 w-3.5" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
            style={{ color: "var(--text-faint)", background: "transparent" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 flex items-center justify-center overflow-auto p-4"
          style={{ minHeight: 300 }}
        >
          {isImg ? (
            <img
              src={effectiveSrc}
              alt="Receipt"
              className="max-w-full rounded"
              style={{ maxHeight: "60vh", objectFit: "contain" }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "linear-gradient(135deg, var(--surface-2) 0%, var(--border) 100%)",
                  border: "1.5px solid var(--border)",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                {fileInfo.ext === "pdf" ? (
                  <FileText className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
                ) : ["csv", "xlsx", "xls"].includes(fileInfo.ext) ? (
                  <FileSpreadsheet className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
                ) : (
                  <File className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
                )}
              </div>
              <h3
                className="text-sm font-semibold mb-2 truncate max-w-xs"
                style={{ color: "var(--text-base)" }}
              >
                {fileInfo.name}
              </h3>
              <p
                className="text-xs mb-6 px-4"
                style={{ color: "var(--text-faint)", lineHeight: "1.6" }}
              >
                Previews for{" "}
                <span className="font-semibold uppercase">{fileInfo.ext}</span>{" "}
                files are not supported in the browser. Please download the file
                to view its contents.
              </p>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 spin" />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download File
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
