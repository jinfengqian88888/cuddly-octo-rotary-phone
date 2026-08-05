exports.requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ code: 1003, message: '权限不足，需要管理员权限' });
};
