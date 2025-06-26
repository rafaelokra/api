import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Listar orçamentos do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { mes, ano } = req.query;
    
    const where = {
      usuarioId: req.user.id,
      ...(mes && { mes: parseInt(mes) }),
      ...(ano && { ano: parseInt(ano) })
    };

    const budgets = await req.prisma.budget.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }]
    });

    res.json({
      success: true,
      budgets
    });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao buscar orçamentos'
    });
  }
});

// Criar orçamento
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { categoria, limite, mes, ano } = req.body;

    if (!categoria || !limite || !mes || !ano) {
      return res.status(400).json({
        error: 'Dados obrigatórios',
        message: 'Categoria, limite, mês e ano são obrigatórios'
      });
    }

    const budget = await req.prisma.budget.create({
      data: {
        categoria,
        limite: parseFloat(limite),
        mes: parseInt(mes),
        ano: parseInt(ano),
        usuarioId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Orçamento criado com sucesso',
      budget
    });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao criar orçamento'
    });
  }
});

// Atualizar orçamento
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, limite, gastoAtual } = req.body;

    const budget = await req.prisma.budget.update({
      where: { 
        id,
        usuarioId: req.user.id
      },
      data: {
        ...(categoria && { categoria }),
        ...(limite && { limite: parseFloat(limite) }),
        ...(gastoAtual !== undefined && { gastoAtual: parseFloat(gastoAtual) })
      }
    });

    res.json({
      success: true,
      message: 'Orçamento atualizado com sucesso',
      budget
    });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao atualizar orçamento'
    });
  }
});

// Deletar orçamento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.budget.delete({
      where: { 
        id,
        usuarioId: req.user.id
      }
    });

    res.json({
      success: true,
      message: 'Orçamento deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao deletar orçamento'
    });
  }
});

export default router;