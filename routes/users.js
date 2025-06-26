import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Listar usuários (apenas admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await req.prisma.user.findMany({
      select: {
        id: true,
        telefone: true,
        nome: true,
        email: true,
        isActive: true,
        isAuthorized: true,
        role: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao buscar usuários'
    });
  }
});

// Buscar perfil do usuário atual
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        telefone: true,
        nome: true,
        email: true,
        avatar: true,
        isActive: true,
        isAuthorized: true,
        role: true,
        lastLogin: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao buscar perfil'
    });
  }
});

// Atualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { nome, email, avatar } = req.body;

    const updatedUser = await req.prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(nome && { nome }),
        ...(email && { email }),
        ...(avatar && { avatar })
      },
      select: {
        id: true,
        telefone: true,
        nome: true,
        email: true,
        avatar: true,
        isActive: true,
        isAuthorized: true,
        role: true,
        lastLogin: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao atualizar perfil'
    });
  }
});

// Autorizar usuário (apenas admin)
router.put('/:id/authorize', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAuthorized } = req.body;

    const user = await req.prisma.user.update({
      where: { id },
      data: { isAuthorized: Boolean(isAuthorized) },
      select: {
        id: true,
        telefone: true,
        nome: true,
        email: true,
        isActive: true,
        isAuthorized: true,
        role: true
      }
    });

    res.json({
      success: true,
      message: `Usuário ${isAuthorized ? 'autorizado' : 'desautorizado'} com sucesso`,
      user
    });
  } catch (error) {
    console.error('Erro ao autorizar usuário:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao autorizar usuário'
    });
  }
});

// Ativar/desativar usuário (apenas admin)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await req.prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      select: {
        id: true,
        telefone: true,
        nome: true,
        email: true,
        isActive: true,
        isAuthorized: true,
        role: true
      }
    });

    res.json({
      success: true,
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      user
    });
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao alterar status do usuário'
    });
  }
});

export default router;