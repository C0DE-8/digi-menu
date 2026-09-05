const secret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32 || /replace|dev-secret/i.test(secret))) {
  throw new Error("Production requires a unique JWT_SECRET of at least 32 characters");
}
module.exports = secret || "ravi-menu-dev-secret";
