import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/auth/authorized-numbers - Buscar números autorizados
router.get('/authorized-numbers', async (req, res) => {
  try {
    const authorizedNumbers = await req.prisma.autorizado.findMany({
      select: {
        id: true,
        numero: true,
        criadoEm: true
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    // Formatar números para exibição
    const formattedNumbers = authorizedNumbers.map(item => ({
      id: item.id,
      numero: item.numero,
      numeroFormatado: formatPhoneForDisplay(item.numero),
      criadoEm: item.criadoEm
    }));

    res.json({
      success: true,
      data: formattedNumbers
    });
  } catch (error) {
    console.error('Erro ao buscar números autorizados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os números autorizados'
    });
  }
});

// POST /api/auth/check-authorization - Verificar se número está autorizado
router.post('/check-authorization', async (req, res) => {
  try {
    const { telefone } = req.body;

    if (!telefone) {
      return res.status(400).json({
        success: false,
        error: 'Telefone é obrigatório'
      });
    }

    // Limpar o número (remover formatação)
    const cleanPhone = telefone.replace(/\D/g, '');

    // Buscar o número no banco (tabela autorizados)
    const authorized = await req.prisma.autorizado.findUnique({
      where: {
        numero: cleanPhone
      }
    });

    if (authorized) {
      res.json({
        success: true,
        authorized: true,
        message: 'Número autorizado',
        data: {
          id: authorized.id,
          numero: authorized.numero
        }
      });
    } else {
      res.status(403).json({
        success: false,
        authorized: false,
        message: 'Número não autorizado para acessar o sistema'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar autorização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível verificar a autorização'
    });
  }
});

// POST /api/auth/login - Login do usuário
router.post('/login', async (req, res) => {
  try {
    const { telefone } = req.body;

    if (!telefone) {
      return res.status(400).json({
        success: false,
        error: 'Telefone é obrigatório',
        message: 'Por favor, informe seu número de telefone'
      });
    }

    // Limpar número de telefone
    const cleanPhone = telefone.replace(/\D/g, '');
    console.log('🔍 Tentativa de login:', cleanPhone);

    // 1. Primeiro verificar se o número está autorizado
    const authorized = await req.prisma.autorizado.findUnique({
      where: {
        numero: cleanPhone
      }
    });

    if (!authorized) {
      return res.status(403).json({
        success: false,
        error: 'Número não autorizado',
        message: 'Este número não tem permissão para acessar o sistema'
      });
    }

    // 2. Buscar ou criar usuário
    let usuario = await req.prisma.usuario.findUnique({
      where: {
        telefone: cleanPhone
      }
    });

    // Se usuário não existe, criar um novo
    if (!usuario) {
      console.log('👤 Criando novo usuário para:', cleanPhone);
      
      usuario = await req.prisma.usuario.create({
        data: {
          telefone: cleanPhone,
          nome: `Usuário ${cleanPhone.slice(-4)}`,
          email: `user${cleanPhone.slice(-4)}@financebot.com`,
          // Senha padrão hash (para casos onde precisa de senha)
          senhaHash: await bcrypt.hash('123456', 10), // Senha padrão temporária
        }
      });
    } else {
      console.log('👤 Usuário existente encontrado:', usuario.id);
    }

    // 3. Verificar se existe chatId (para integração com WhatsApp)
    if (!usuario.chatId) {
      // Atualizar com chatId se necessário
      await req.prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          atualizadoEm: new Date()
        }
      });
    }

    // 4. Gerar token JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado');
    }

    const token = jwt.sign(
      { 
        userId: usuario.id,
        telefone: usuario.telefone,
        nome: usuario.nome,
        email: usuario.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Retornar dados do usuário (sem senha)
    const { senhaHash, ...userData } = usuario;
    
    console.log('✅ Login bem-sucedido para:', usuario.telefone);
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        ...userData,
        isNewUser: !usuario.chatId // Indica se é um usuário novo
      },
      token
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: 'Erro ao realizar login. Tente novamente.'
    });
  }
});

// GET /api/auth/verify - Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Buscar dados atualizados do usuário
    const usuario = await req.prisma.usuario.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        chatId: true,
        criadoEm: true,
        atualizadoEm: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      user: usuario
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar autenticação'
    });
  }
});

// POST /api/auth/logout - Logout (invalidar token no frontend)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// POST /api/auth/add-authorized - Adicionar número autorizado (para admin)
router.post('/add-authorized', async (req, res) => {
  try {
    const { numero } = req.body;

    if (!numero) {
      return res.status(400).json({
        success: false,
        error: 'Número é obrigatório'
      });
    }

    const cleanPhone = numero.replace(/\D/g, '');

    // Verificar se já existe
    const existing = await req.prisma.autorizado.findUnique({
      where: { numero: cleanPhone }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Número já está autorizado'
      });
    }

    // Adicionar novo número
    const newAuthorized = await req.prisma.autorizado.create({
      data: {
        numero: cleanPhone
      }
    });

    console.log('✅ Novo número autorizado:', cleanPhone);

    res.status(201).json({
      success: true,
      message: 'Número autorizado com sucesso',
      data: {
        ...newAuthorized,
        numeroFormatado: formatPhoneForDisplay(cleanPhone)
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar número autorizado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível adicionar o número'
    });
  }
});

// DELETE /api/auth/remove-authorized/:id - Remover número autorizado
router.delete('/remove-authorized/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await req.prisma.autorizado.delete({
      where: { id: parseInt(id) }
    });

    console.log('🗑️ Número removido:', deleted.numero);

    res.json({
      success: true,
      message: 'Número removido da lista de autorizados',
      data: deleted
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Número não encontrado'
      });
    }

    console.error('Erro ao remover número:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover número'
    });
  }
});

// Função helper para formatar telefone
function formatPhoneForDisplay(phone) {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

export default router;