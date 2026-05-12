import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = async (file, folder = "users") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `kpi/${folder}`,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );

        uploadStream.end(file.buffer);
    });
};
