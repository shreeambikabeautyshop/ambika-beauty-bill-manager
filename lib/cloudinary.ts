import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export { cloudinary };

/**
 * Upload a bill image to Cloudinary under
 * ambika-bills/{year}/{month}/{date}_{billNo}
 */
export async function uploadBillImage(
  fileBuffer: Buffer,
  billNo: string,
  billDate: string,   // "DD/MM/YYYY"
  mimeType: string
): Promise<{ url: string; public_id: string; folder: string }> {
  // Parse date for folder structure
  const [day, month, year] = billDate.split("/");
  const folder = `ambika-bills/${year}/${month}`;
  const publicId = `${folder}/${year}-${month}-${day}_bill-${billNo}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        format: mimeType.includes("pdf") ? "pdf" : "jpg",
        quality: "auto:best",
        tags: [`bill-${billNo}`, `date-${year}-${month}-${day}`, "ambika-beauty"],
        context: { bill_no: billNo, bill_date: billDate },
        overwrite: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({
          url:       result!.secure_url,
          public_id: result!.public_id,
          folder:    folder,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

/** Get all bills grouped by date from Cloudinary */
export async function getBillsByDate(year?: string, month?: string) {
  const prefix = month
    ? `ambika-bills/${year}/${month}`
    : year
    ? `ambika-bills/${year}`
    : "ambika-bills";

  const result = await cloudinary.api.resources({
    type: "upload",
    prefix,
    max_results: 500,
    context: true,
    tags: true,
  });
  return result.resources;
}
