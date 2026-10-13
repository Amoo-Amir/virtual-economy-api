const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Authentication required",
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string") {
      return res.status(401).json({
        status: "error",
        message: "Invalid access token",
      });
    }

    req.user = {
      id: payload.sub,
    };

    return next();
  } catch (error) {
    console.error("[AUTH] Verification failed:", error.message);

    return res.status(401).json({
      status: "error",
      message: "Invalid or expired access token",
    });
  }
};

module.exports = { authenticate };
