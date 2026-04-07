import { logAudit } from "./audit.service.js";

/*
Generic audit middleware
Used for CREATE / UPDATE / DELETE routes
*/

const auditMiddleware = ({ action, entity }) => {

    if (!action || !entity) {
        throw new Error("auditMiddleware requires action and entity");
    }

    return (req, res, next) => {

        let isLogged = false; // prevent duplicate logs

        const originalJson = res.json.bind(res);

        res.json = (data) => {

            /* Call original response first (important) */
            const response = originalJson(data);

            /* Only log once & only success responses */
            if (!isLogged && res.statusCode < 400) {
                isLogged = true;

                /* Run audit async (non-blocking) */
                setImmediate(async () => {
                    try {

                        /* Better entityId detection */
                        let entityId = null;

                        if (data?._id) {
                            entityId = data._id;
                        } else if (data?.user?._id) {
                            entityId = data.user._id;
                        } else if (Array.isArray(data) && data.length > 0) {
                            entityId = data[0]?._id || null;
                        } else if (req.params?.id) {
                            entityId = req.params.id;
                        }

                        await logAudit({
                            actor: req.user?._id || null,
                            action,
                            entity,
                            entityId,
                            metadata: {
                                method: req.method,
                                url: req.originalUrl,
                                statusCode: res.statusCode
                            },
                            req
                        });

                    } catch (error) {
                        console.error("Audit middleware error:", error.message);
                    }
                });
            }

            return response;
        };

        next();
    };
};

export default auditMiddleware;