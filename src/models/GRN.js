import mongoose from "mongoose";

const grnItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
        required: true
    },

    unit: {
        type: String,
        enum: ["kg", "ton", "meter", "piece"]
    },

    orderedQty: {
        type: Number,
        required: true
    },

    receivedQty: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const grnSchema = new mongoose.Schema({

    purchaseOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PurchaseOrder",
        required: true,
        index: true
    },

    receivedItems: [grnItemSchema],

    receivedDate: {
        type: Date,
        default: Date.now
    },

    notes: String,

    isActive: {
        type: Boolean,
        default: true
    },

    grnNumber: {
        type: String,
        unique: true
    }

}, { timestamps: true });

grnSchema.index({ purchaseOrder: 1, createdAt: -1 });
grnSchema.pre("save", async function (next) {

    if (!this.grnNumber) {

        const count = await mongoose.model("GRN").countDocuments();

        this.grnNumber = `GRN-${String(count + 1).padStart(5, "0")}`;
    }
});

export default mongoose.model("GRN", grnSchema);