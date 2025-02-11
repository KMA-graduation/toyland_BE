export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN,
    secretRefresh: process.env.JWT_SECRET_REFRESH_KEY,
    expiresInRefresh: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  vnpay: {
    tmnCode: process.env.VNPAY_TMNCODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    url: process.env.VNPAY_URL,
    api: process.env.VNPAY_API,
    returnUrl: process.env.VNPAY_RETURN_URL,
  },
});
