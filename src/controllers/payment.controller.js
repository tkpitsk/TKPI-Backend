import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Ledger from "../models/Ledger.js";
import SalesInvoice from "../models/SalesInvoice.js";
import { validatePayment } from "../validators/payment.validator.js";

export const createPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { isValid, errors } = validatePayment(req.body);

        if (!isValid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ errors });
        }

        const { type, entityId, amount, method, note, referenceId } = req.body;

        /* ================= OPTIONAL: VALIDATE INVOICE ================= */
        let invoice = null;

        if (referenceId) {
            invoice = await SalesInvoice.findById(referenceId).session(session);

            if (!invoice) {
                throw new Error("Referenced invoice not found");
            }

            if (invoice.status === "cancelled") {
                throw new Error("Cannot pay cancelled invoice");
            }

            /* 🔥 PREVENT OVERPAYMENT */
            const existingPayments = await Ledger.find({
                invoiceId: referenceId
            }).session(session);

            const alreadyPaid = existingPayments.reduce(
                (sum, e) => sum + e.amount,
                0
            );

            const remaining = invoice.totalAmount - alreadyPaid;

            if (amount > remaining) {
                throw new Error("Payment exceeds invoice due amount");
            }
        }

        /* ================= CREATE PAYMENT ================= */
        const [payment] = await Payment.create(
            [
                {
                    type,
                    entityId,
                    amount,
                    method,
                    note,
                    reference: referenceId || null,
                    createdBy: req.user.id,
                },
            ],
            { session }
        );

        /* ================= LEDGER ENTRY ================= */
        await Ledger.create([
            {
                type: type === "customer" ? "credit" : "debit",
                amount,
                entityType: type,
                entityId,

                referenceType: "payment",
                referenceId: payment._id,

                invoiceId: referenceId || null, // 🔥 ADD THIS

                paymentMethod: method,
                note,
                createdBy: req.user.id,
            }
        ], { session });

        /* ================= OPTIONAL: UPDATE INVOICE SNAPSHOT ================= */
        if (invoice) {
            const totalCredits = await Ledger.aggregate([
                {
                    $match: {
                        invoiceId: invoice._id,
                        type: "credit"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }
                }
            ]).session(session);

            const paidAmount = totalCredits[0]?.total || 0;

            invoice.paidAmount = paidAmount;
            invoice.dueAmount = invoice.totalAmount - paidAmount;

            if (invoice.dueAmount <= 0) {
                invoice.paymentStatus = "paid";
            } else if (invoice.paidAmount > 0) {
                invoice.paymentStatus = "partial";
            } else {
                invoice.paymentStatus = "unpaid";
            }

            await invoice.save({ session });
        }

        await session.commitTransaction();

        res.json({
            message: "Payment recorded successfully",
            payment,
        });

    } catch (err) {
        await session.abortTransaction();

        res.status(500).json({
            message: err.message,
        });

    } finally {
        session.endSession();
    }
};