import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/download?url=<encoded-cloudinary-url>&name=<filename>
 *
 * Proxies a file from Cloudinary (or any URL) through the server so the
 * browser receives it as a proper attachment download, bypassing:
 *  - The CORS restriction that makes <a download> fail for cross-origin URLs
 *  - Cloudinary's /image/upload/ PDFs returning non-downloadable responses
 *
 * For Cloudinary PDFs stored under /image/upload/ we also try the
 * /raw/upload/ variant in case the file was re-uploaded correctly later.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  const filename = searchParams.get("name") || "attachment";

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Build the list of URLs to try in order.
  // For legacy /image/upload/ non-image files, also attempt /raw/upload/.
  const urlsToTry: string[] = [rawUrl];

  try {
    const parsed = new URL(rawUrl);
    if (
      parsed.hostname.endsWith("cloudinary.com") &&
      parsed.pathname.includes("/image/upload/")
    ) {
      const rawVariant = rawUrl.replace("/image/upload/", "/raw/upload/");
      if (rawVariant !== rawUrl) urlsToTry.push(rawVariant);
    }
  } catch {
    /* not a valid URL — proceed with original only */
  }

  let lastError = "";

  for (const url of urlsToTry) {
    try {
      const upstream = await fetch(url, {
        // Forward a browser-like Accept header so Cloudinary serves the raw file
        headers: { Accept: "*/*" },
      });

      if (!upstream.ok) {
        lastError = `Upstream returned ${upstream.status} for ${url}`;
        continue; // try next URL variant
      }

      const contentType =
        upstream.headers.get("content-type") || "application/octet-stream";
      const body = await upstream.arrayBuffer();

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Content-Length": String(body.byteLength),
          // Allow the browser to use this response (important for blob approach)
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  return NextResponse.json(
    { error: `Could not fetch attachment: ${lastError}` },
    { status: 502 }
  );
}
