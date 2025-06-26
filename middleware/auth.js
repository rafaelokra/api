// api/middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso requerido',
      message: 'Você precisa estar autenticado para acessar este recurso'
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET não configurado');
    return res.status(500).json({
      success: false,
      error: 'Erro de configuração do servidor'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ Token inválido:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expirado',
          message: 'Sua sessão expirou. Faça login novamente.'
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({
          success: false,
          error: 'Token inválido',
          message: 'Token de acesso inválido'
        });
      }
      
      return res.status(403).json({
        success: false,
        error: 'Falha na autenticação',
        message: 'Não foi possível verificar seu token de acesso'
      });
    }

    console.log('✅ Token válido para usuário:', user.userId);
    req.user = user;
    next();
  });
};

// Middleware opcional - só continua se tiver token válido
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  if (!process.env.JWT_SECRET) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// Middleware para verificar se usuário é admin (se você precisar)
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticação requerida'
    });
  }

  // Como não temos campo role no schema atual, vamos usar uma lógica simples
  // Por exemplo, números que terminam em 7777 são admin
  const isAdmin = req.user.telefone && req.user.telefone.endsWith('7777');
  
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      message: 'Você não tem permissão para acessar este recurso'
    });
  }

  next();
};