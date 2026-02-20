import { v2 as cloudinary } from "cloudinary";
cloudinary.config({ 
  cloud_name: 'dys0km2lf', 
  api_key: '825711747272126', 
  api_secret: 'Tc5UoEMFR0-TXf120TVmRvS856Y'
});

const uploadToCloudinary = async (file: Blob): Promise<string | null> => {
  if (!file) return null;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result?.secure_url ?? null);
          }
        }
      );
      uploadStream.end(buffer);
    });

  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
};

export default uploadToCloudinary;
