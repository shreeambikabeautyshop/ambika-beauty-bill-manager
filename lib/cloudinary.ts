import { v2 as cloudinary } from "cloudinary";

// Lazy config — only runs when called, not at module import time
function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
    api_key:    process.env.CLOUDINARY_API_KEY    || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
    secure:     true,
  });
  return cloudinary;
}

export { cloudinary };

/**
 * Upload a bill image to Cloudinary
 * Folder: ambika-bills/{year}/{month}/{date}_{billNo}
 */
export async function uploadBillImage(
  fileBuffer: Buffer,
  billNo:     string,
  billDate:   string,  // "DD/MM/YYYY"
  mimeType:   string
): Promise<{ url: string; public_id: string; folder: string }> {
  const cl = getCloudinary();

  const [day, month, year] = (billDate || "01/01/2024").split("/");
  const folder   = `ambika-bills/${year}/${month}`;
  const publicId = `${folder}/${year}-${month}-${day}_bill-${billNo}`;

  return new Promise((resolve, reject) => {
    const stream = cl.uploader.upload_stream(
      {
        public_id:     publicId,
        resource_type: "image",
        quality:       "auto:best",
        tags:          [`bill-${billNo}`, `date-${year}-${month}-${day}`, "ambika-beauty"],
        context:       { bill_no: billNo, bill_date: billDate },
        overwrite:     false,
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve({ url: result.secure_url, public_id: result.public_id, folder });
      }
    );
    stream.end(fileBuffer);
  });
}

/** Get bills from Cloudinary by date range */
export async function getBillsByDate(year?: string, month?: string) {
  const cl     = getCloudinary();
  const prefix = month ? `ambika-bills/${year}/${month}`
               : year  ? `ambika-bills/${year}`
               : "ambika-bills";
  const result = await cl.api.resources({ type: "upload", prefix, max_results: 500, context: true, tags: true });
  return result.resources;
}
