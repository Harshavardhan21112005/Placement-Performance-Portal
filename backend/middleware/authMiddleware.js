import jwt from "jsonwebtoken";
import redis from "../config/redis.js";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";


export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // ✅ Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Check Redis
    const session = await redis.get(`session:${decoded.id}:${token}`);
    if (!session) {
      return res.status(401).json({ error: "Session expired or logged out" });
    }

    // Attach decoded user info to request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authPRorStudent = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Allow PR or Student
    if (decoded.role !== "PR" && decoded.role !== "student") {
      return res
        .status(403)
        .json({ error: "Only PR or Student can access this route" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};


export const authAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Only admins can access this route" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};


export const authPR = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded JWT payload:", decoded);

    if (decoded.role !== "PR") {
      return res.status(403).json({ error: "Only PRs can access this route" });
    }

    req.user = decoded; // save user info for later
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
