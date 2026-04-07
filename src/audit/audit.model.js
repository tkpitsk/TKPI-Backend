import mongoose from "mongoose";

const auditSchema = new mongoose.Schema({

    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    action: {
        type: String,
        required: true
    },

    entity: {
        type: String,
        required: true
    },

    entityId: {
        type: mongoose.Schema.Types.ObjectId
    },

    changes: {
        type: Object
    },

    metadata: {
        type: Object
    },

    ipAddress: String,

    userAgent: String

},
    { timestamps: true });

export default mongoose.model("AuditLog", auditSchema);