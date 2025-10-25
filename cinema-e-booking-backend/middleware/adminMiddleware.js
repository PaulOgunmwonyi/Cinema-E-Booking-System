function adminMiddleware(req, res, next) {
  try {
    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Access denied.' });
  }
}

module.exports = adminMiddleware;
