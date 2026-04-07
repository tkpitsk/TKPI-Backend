import Advance from "../models/Advance.js";

/* ================= GIVE ADVANCE ================= */
export const giveAdvance = async (req, res) => {
    try {
        const { employeeId, amount, date, reason } = req.body;

        const advance = await Advance.create({
            employee: employeeId,
            amount,
            date,
            reason,
            givenBy: req.user._id,
        });

        res.status(201).json({
            message: "Advance recorded",
            advance,
        });
    } catch {
        res.status(500).json({
            message: "Failed to record advance",
        });
    }
};

/* ================= GET ADVANCES ================= */
export const getAdvances = async (req, res) => {
    const { employeeId, start, end } = req.query;

    const advances = await Advance.find({
        employee: employeeId,
        date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    res.json(advances);
};

export const getMyAdvances = async (req, res) => {
    const { start, end } = req.query;

    const advances = await Advance.find({
        employee: req.user._id,
        date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    res.json(advances);
};
