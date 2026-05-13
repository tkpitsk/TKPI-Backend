import Brand from "../models/Brand.js";

/**
 * @desc    Create a new brand
 * @route   POST /api/brands
 * @access  Private/Admin
 */
export const createBrand = async (req, res) => {
    try {
        const { name, description, country, featured, status } = req.body;

        const brandExists = await Brand.findOne({ name });
        if (brandExists) {
            return res.status(400).json({ message: "Brand already exists" });
        }

        const brand = await Brand.create({
            name,
            description,
            country,
            featured,
            status
        });

        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all brands
 * @route   GET /api/brands
 * @access  Public
 */
export const getBrands = async (req, res) => {
    try {
        const brands = await Brand.find({}).sort({ name: 1 });
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get brand by ID
 * @route   GET /api/brands/:id
 * @access  Public
 */
export const getBrandById = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }
        res.json(brand);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update brand
 * @route   PUT /api/brands/:id
 * @access  Private/Admin
 */
export const updateBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }

        const updatedBrand = await Brand.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.json(updatedBrand);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete/Deactivate brand
 * @route   DELETE /api/brands/:id
 * @access  Private/Admin
 */
export const deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }

        brand.status = "inactive";
        await brand.save();

        res.json({ message: "Brand deactivated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
