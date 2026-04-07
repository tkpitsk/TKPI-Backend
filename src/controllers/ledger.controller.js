import Ledger from "../models/Ledger.js";

export const getLedgerByEntity = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        const entries = await Ledger.find({
            entityType,
            entityId,
        }).sort({ createdAt: 1 });

        let balance = 0;

        const result = entries.map((e) => {
            if (e.type === "debit") balance += e.amount;
            else balance -= e.amount;

            return {
                ...e.toObject(),
                runningBalance: balance,
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};