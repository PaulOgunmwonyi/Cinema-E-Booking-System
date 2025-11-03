const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const byField = {};
  for (const err of result.array({ onlyFirstError: true })) {
    if (!byField[err.path]) byField[err.path] = [];
    byField[err.path].push(err.msg);
  }
  return res.status(422).json({
    message: 'Validation failed.',
    errors: byField
  });
};
