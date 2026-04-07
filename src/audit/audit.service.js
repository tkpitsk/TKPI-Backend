import AuditLog from "./audit.model.js";

export const logAudit = async ({
    actor,
    action,
    entity,
    entityId,
    changes,
    metadata,
    req
}) => {

    try {

        await AuditLog.create({

            actor,
            action,
            entity,
            entityId,

            changes,
            metadata,

            ipAddress: req?.ip || req?.headers["x-forwarded-for"],
            userAgent: req?.headers["user-agent"]

        });

    } catch (error) {

        console.error("Audit log failed:", error.message);

    }

};