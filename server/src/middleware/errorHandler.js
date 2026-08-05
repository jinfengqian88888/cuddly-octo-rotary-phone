exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message || err);
  res.status(500).json({ code: -1, message: err.message || '服务器内部错误' });
};
