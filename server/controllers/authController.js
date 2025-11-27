const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Create JWT
function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

// ===================================================================================
// GOOGLE LOGIN (GIS ID TOKEN — response.credential)
// ===================================================================================
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google ID token missing" });
    }

    // Verify Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create new Google user
      user = await User.create({
        name: name || "No Name",
        email,
        avatar: picture || "",
        googleId,          // <-- added
        password: null     // <-- keep null since you don't use passwords
      });

    } else {
      // Existing user (from older testing)
      let changed = false;

      if (!user.googleId) {
        user.googleId = googleId;  // <-- upgrade user to Google auth
        changed = true;
      }

      if (name && user.name !== name) { 
        user.name = name; 
        changed = true; 
      }

      if (picture && user.avatar !== picture) { 
        user.avatar = picture; 
        changed = true; 
      }

      if (changed) await user.save();
    }

    const token = generateToken(user._id);

    return res.json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });

  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error.message);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};

// ===================================================================================
// GET LOGGED-IN USER
// ===================================================================================
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
