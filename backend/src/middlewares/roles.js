// =============================================================================
// Middleware de verificação de papel (role).
// Funciona junto com o auth.js — depois que o usuário já foi autenticado,
// usamos esse aqui pra checar se ele tem a permissão certa pra acessar
// determinada rota. Exemplo: requireRole("admin") barra quem não é admin.
// É uma função que retorna outra função (higher-order), assim podemos
// passar o role desejado como parâmetro na hora de usar.
// =============================================================================

export function requireRole(role) {
  return (req, res, next) => {
    // Se req.user não existe, o middleware de auth não rodou antes
    // ou o token era inválido — o usuário não está autenticado.
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
