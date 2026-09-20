exports.success = (res, data = null, msg = 'ok') => res.json({ code: 0, msg, data });
exports.fail = (res, msg = 'error', code = 400) => res.json({ code, msg, data: null });
