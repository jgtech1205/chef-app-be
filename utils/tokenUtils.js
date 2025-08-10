const jwt = require("jsonwebtoken")

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" })

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key", {
    expiresIn: "30d",
  })

  return { accessToken, refreshToken }
}

const verifyToken = (token, secret) => {
  return jwt.verify(token, secret)
}

module.exports = {
  generateTokens,
  verifyToken,
}
