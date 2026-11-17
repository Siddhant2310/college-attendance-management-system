
const requirePasswordChange = (req, res, next) => {
    if (req.user && req.user.isFirstLogin) {
        return res.status(403).json({
            success: false,
            code: "PASSWORD_CHANGE_REQUIRED",
            message: "Please change your temporary password before accessing this resource."
        });
    }

    next();
};

module.exports = requirePasswordChange;
