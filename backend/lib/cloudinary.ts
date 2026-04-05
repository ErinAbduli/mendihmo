import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const cloudinaryConfig =
	cloudName && apiKey && apiSecret
		? {
				cloud_name: cloudName,
				api_key: apiKey,
				api_secret: apiSecret,
			}
		: null;

const hasCloudinaryConfig = cloudinaryConfig !== null;

if (hasCloudinaryConfig) {
	cloudinary.config(cloudinaryConfig);
}

export { cloudinary, hasCloudinaryConfig };