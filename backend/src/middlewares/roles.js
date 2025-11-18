export function requireRole(role) {
  return (req, res, next) => {
    
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const roles = req.user.roles || [];

    const hasRole = Array.isArray(roles) && roles.includes(role);

    if (!hasRole) {
      return res.status(403).json({ error: "Precisa estar logado como admin" });
    }

    return next();
  };
}
