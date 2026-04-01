export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};
export const requireUnlistedAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "UNLISTEDADMIN") {
    return res
      .status(403)
      .json({ message: "Access denied. Unlisted Admin only." });
  }

  next();
};
export const requireUnlistedUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "CUSTOMER") {
    return res
      .status(403)
      .json({ message: "Access denied. Unlisted User only." });
  }

  next();
};


export const requireAdminAndHR = (req, res, next) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "HR") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin or HR only." });
  }
  next();
};

export const requireDsa = (req, res, next) => {
  if (req.user.role !== "DSA") {
    return res.status(403).json({ message: "Access denied. DSA only." });
  }
  next();
};

export const requireDsaAndCustomer = (req, res, next) => {
  if (req.user.role !== "DSA" && req.user.role !== "CUSTOMER") {
    return res.status(403).json({ message: "Access denied. DSA or Customer only." });
  }
  next();
};

export const requireDept = (req, res, next) => {
  if (req.user.role !== "DEPARTMENTHEAD") {
    return res
      .status(403)
      .json({ message: "Access denied. Department Head only." });
  }
  next();
};
