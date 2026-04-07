import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import { logAudit } from "../audit/audit.service.js";
import { AUDIT_ACTIONS } from "../audit/audit.constants.js";

/* ================= LOGIN ================= */
export const login = async (req, res) => {

  try {

    const { userId, password } = req.body;

    const user = await User.findOne({ userId, isActive: true });

    /* USER NOT FOUND */
    if (!user) {

      await logAudit({
        action: AUDIT_ACTIONS.FAILED_LOGIN,
        entity: "USER",
        metadata: { userId },
        req
      });

      return res.status(401).json({ message: "Invalid credentials" });

    }

    const isMatch = await bcrypt.compare(password, user.password);

    /* WRONG PASSWORD */
    if (!isMatch) {

      await logAudit({
        action: AUDIT_ACTIONS.FAILED_LOGIN,
        entity: "USER",
        metadata: { userId },
        req
      });

      return res.status(401).json({ message: "Invalid credentials" });

    }

    /* CREATE TOKENS */
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
    );

    /* SAVE REFRESH TOKEN COOKIE */
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    /* LOGIN SUCCESS AUDIT */
    await logAudit({
      actor: user._id,
      action: AUDIT_ACTIONS.LOGIN,
      entity: "USER",
      entityId: user._id,
      req
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        userId: user.userId,
        role: user.role
      }
    });

  } catch (error) {

    res.status(500).json({
      message: "Login failed"
    });

  }

};

/* ================= REFRESH TOKEN ================= */
export const refreshToken = async (req, res) => {

  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
    );

    res.json({ accessToken: newAccessToken });

  } catch {

    return res.status(401).json({ message: "Invalid refresh token" });

  }

};

/* ================= LOGOUT ================= */
export const logout = async (req, res) => {

  try {

    const userId = req.user?._id;

    res.clearCookie("refreshToken");

    if (userId) {

      await logAudit({
        actor: userId,
        action: AUDIT_ACTIONS.LOGOUT,
        entity: "USER",
        entityId: userId,
        req
      });

    }

    res.json({ message: "Logged out" });

  } catch {

    res.json({ message: "Logged out" });

  }

};

/* ================= ME ================= */
export const me = async (req, res) => {

  const user = await User
    .findById(req.user._id)
    .select("-password");

  res.json({
    user
  });

};