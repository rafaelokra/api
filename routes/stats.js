import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Estatísticas do dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Total de receitas
    const totalReceitas = await req.prisma.receita.aggregate({
      where: { usuarioId: userId },
      _sum: { valor: true }
    });

    // Total de gastos
    const totalGastos = await req.prisma.gasto.aggregate({
      where: { usuarioId: userId },
      _sum: { valor: true }
    });

    // Transações do mês
    const transacoesMes = await Promise.all([
      req.prisma.gasto.count({
        where: {
          usuarioId: userId,
          data: { gte: startOfMonth }
        }
      }),
      req.prisma.receita.count({
        where: {
          usuarioId: userId,
          data: { gte: startOfMonth }
        }
      })
    ]);

    // Categoria top de gastos
    const topGastoCategoria = await req.prisma.gasto.groupBy({
      by: ['categoria'],
      where: { usuarioId: userId },
      _sum: { valor: true },
      orderBy: { _sum: { valor: 'desc' } },
      take: 1
    });

    // Categoria top de receitas
    const topReceitaCategoria = await req.prisma.receita.groupBy({
      by: ['descricao'],
      where: { usuarioId: userId },
      _sum: { valor: true },
      orderBy: { _sum: { valor: 'desc' } },
      take: 1
    });

    const stats = {
      totalReceitas: totalReceitas._sum.valor || 0,
      totalGastos: totalGastos._sum.valor || 0,
      saldo: (totalReceitas._sum.valor || 0) - (totalGastos._sum.valor || 0),
      transacoesMes: transacoesMes[0] + transacoesMes[1],
      categoriaTopGasto: topGastoCategoria[0] ? {
        nome: topGastoCategoria[0].categoria,
        valor: topGastoCategoria[0]._sum.valor
      } : null,
      categoriaTopReceita: topReceitaCategoria[0] ? {
        nome: topReceitaCategoria[0].descricao,
        valor: topReceitaCategoria[0]._sum.valor
      } : null
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao buscar estatísticas'
    });
  }
});

// Estatísticas por categoria
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const { tipo = 'gastos' } = req.query;
    const userId = req.user.id;

    let categoryStats;

    if (tipo === 'gastos') {
      categoryStats = await req.prisma.gasto.groupBy({
        by: ['categoria'],
        where: { usuarioId: userId },
        _sum: { valor: true },
        _count: true,
        orderBy: { _sum: { valor: 'desc' } }
      });
    } else {
      categoryStats = await req.prisma.receita.groupBy({
        by: ['descricao'],
        where: { usuarioId: userId },
        _sum: { valor: true },
        _count: true,
        orderBy: { _sum: { valor: 'desc' } }
      });
    }

    const total = categoryStats.reduce((acc, cat) => acc + (cat._sum.valor || 0), 0);

    const formattedStats = categoryStats.map((cat, index) => ({
      categoria: tipo === 'gastos' ? cat.categoria : cat.descricao,
      total: cat._sum.valor || 0,
      transacoes: cat._count,
      percentual: total > 0 ? ((cat._sum.valor || 0) / total) * 100 : 0,
      cor: `hsl(${(index * 45) % 360}, 70%, 50%)`
    }));

    res.json({
      success: true,
      categoryStats: formattedStats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas por categoria:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao buscar estatísticas por categoria'
    });
  }
});

// Estatísticas temporais
router.get('/timeline', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Buscar gastos por dia
    const gastosPorDia = await req.prisma.gasto.groupBy({
      by: ['data'],
      where: {
        usuarioId: userId,
        data: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { valor: true }
    });

    // Buscar receitas por dia
    const receitasPorDia = await req.prisma.receita.groupBy({
      by: ['data'],
      where: {
        usuarioId: userId,
        data: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { valor: true }
    });

    // Criar array de dias
    const timelineData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      const gastos = gastosPorDia
        .filter(g => g.data.toISOString().split('T')[0] === dateStr)
        .reduce((acc, g) => acc + (g._sum.valor || 0), 0);
      
      const receitas = receitasPorDia
        .filter(r => r.data.toISOString().split('T')[0] === dateStr)
        .reduce((acc, r) => acc + (r._sum.valor || 0), 0);

      timelineData.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        gastos,
        receitas,
        saldo: receitas - gastos
      });
    }

    res.json({
      success: true,
      timelineData
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas temporais:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao buscar estatísticas temporais'
    });
  }
});

export default router;