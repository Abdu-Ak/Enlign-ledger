import { v2 as cloudinary } from "cloudinary";

// Read environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Determine if Cloudinary is fully configured
const isConfigured = !!(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log("Cloudinary Media Upload Engine configured successfully.");
} else {
  console.warn(
    "Cloudinary environment variables missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). " +
      "Falling back to local high-fidelity Base64 file attachments inside ledger.json."
  );
}

/**
 * Derive the correct Cloudinary resource_type from a base64 data URI MIME type.
 * Cloudinary's 'auto' misclassifies PDFs as images, generating broken /image/upload/ URLs.
 * We explicitly use 'raw' for everything except true images so the URL is always valid.
 */
function getResourceType(base64: string): "image" | "raw" {
  const match = base64.match(/^data:([^;]+);/);
  const mime = match ? match[1].toLowerCase() : "";
  if (mime.startsWith("image/")) return "image";
  return "raw"; // PDF, CSV, DOCX, XLSX, etc.
}

/**
 * Uploads a file (base64 data string) to Cloudinary.
 * If Cloudinary credentials are not configured, it returns the base64 string directly
 * as a graceful local fallback.
 *
 * @param fileBase64 The Base64 Data URL string (e.g. "data:image/png;base64,...")
 * @returns Promise<string> The secure Cloudinary URL or the local Base64 string fallback
 */
export async function uploadToCloudinary(fileBase64: string): Promise<string> {
  if (!fileBase64) {
    return "";
  }

  // Already a URL — nothing to upload
  if (!fileBase64.startsWith("data:")) {
    return fileBase64;
  }

  if (!isConfigured) {
    // Graceful fallback to raw base64 string
    return fileBase64;
  }

  try {
    const resourceType = getResourceType(fileBase64);
    const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
      folder: "institutional_finance_tracker",
      resource_type: resourceType,
    });

    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed, falling back to local Base64:", error);
    // Return base64 string so the user's upload still succeeds locally
    return fileBase64;
  }
}
