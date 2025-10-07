const ApiError = require('../utils/ApiError');
const { t } = require('../i18n');

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof ApiError) {
    const message = t(req.lang, err.message);
    return res.status(err.statusCode).json({
      success: false,
      message: message,
    });
  }

  // For other types of errors, return a generic 500 error
  const message = t(req.lang, 'common.network_error');
  return res.status(500).json({
    success: false,
    message: message,
  });
}

module.exports = errorHandler;