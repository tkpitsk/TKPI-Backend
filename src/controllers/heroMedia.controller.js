import HeroMedia from "../models/HeroMedia.js";
import cloudinary from "../config/cloudinary.js";

/* ================= UPLOAD ================= */
export const uploadHeroMedia = async (req, res) => {
    try {
        const { file } = req;
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const type = file.mimetype.startsWith("video")
            ? "video"
            : "image";

        const upload = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: type,
                    folder: "hero-media",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            stream.end(file.buffer);
        });

        const lastItem = await HeroMedia.findOne().sort({ order: -1 });
        const nextOrder = lastItem ? lastItem.order + 1 : 1;

        const media = await HeroMedia.create({
            type,
            url: upload.secure_url,
            publicId: upload.public_id,
            order: nextOrder,
        });

        res.status(201).json(media);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Upload failed" });
    }
};

/* ================= GET ALL ================= */
export const getHeroMedia = async (req, res) => {
    const media = await HeroMedia.find().sort({ order: 1 });
    res.json(media);
};

/* ================= REORDER ================= */
export const reorderHeroMedia = async (req, res) => {
    const { items } = req.body;
    // items = [{ id, order }]

    if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid payload" });
    }

    const bulk = items.map((item) => ({
        updateOne: {
            filter: { _id: item.id },
            update: { order: item.order },
        },
    }));

    await HeroMedia.bulkWrite(bulk);

    res.json({ message: "Reordered successfully" });
};

/* ================= DELETE ================= */
export const deleteHeroMedia = async (req, res) => {
    try {
        const media = await HeroMedia.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ message: "Not found" });
        }

        await cloudinary.uploader.destroy(media.publicId, {
            resource_type: media.type,
        });

        await media.deleteOne();

        res.json({ message: "Deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Delete failed" });
    }
};
