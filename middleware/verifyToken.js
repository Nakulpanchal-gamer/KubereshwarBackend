// middlewares/verifyToken.js
const jwt = require('jsonwebtoken');

module.exports = function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
