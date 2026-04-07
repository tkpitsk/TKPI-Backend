import Reminder from "../models/Reminder.js";

/* ================= CREATE ================= */
export const createReminder = async (req, res) => {
    try {
        const { title, date, expiryDate } = req.body;

        if (!title || !date || !expiryDate) {
            return res.status(400).json({
                message: "Title, date and expiry date are required",
            });
        }

        const reminder = await Reminder.create({
            ...req.body,
            createdBy: req.user._id,
        });

        res.status(201).json(reminder);
    } catch (err) {
        console.error("Create reminder error:", err);
        res.status(500).json({
            message: err.message || "Failed to create reminder",
        });
    }
};


/* ================= LIST ================= */
export const getReminders = async (req, res) => {
    const { start, end } = req.query;

    const filter = {};

    if (start && end) {
        filter.date = {
            $gte: new Date(start),
            $lte: new Date(end),
        };
    }

    const reminders = await Reminder.find(filter).sort({ date: 1 });
    res.json(reminders);
};

/* ================= UPDATE ================= */
export const updateReminder = async (req, res) => {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder)
        return res.status(404).json({ message: "Not found" });

    Object.assign(reminder, req.body);
    await reminder.save();

    res.json(reminder);
};

/* ================= DELETE ================= */
export const deleteReminder = async (req, res) => {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
};
