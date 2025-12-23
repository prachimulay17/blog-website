const asyncHandeler = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    next(error); // ✅ pass error to global error handler
  }
};

export { asyncHandeler };
