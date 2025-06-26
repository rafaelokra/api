// api/routes/transactions.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/transactions - Buscar todas as transações do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 50, tipo, categoria, dataInicio, dataFim } = req.query;

    console.log('📊 Buscando transações para usuário:', userId);

    // Construir filtros
    const where = {
      usuarioId: userId
    };

    // Filtro por data
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) {
        where.data.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.data.lte = new Date(dataFim);
      }
    }

    // Filtro por categoria (para gastos)
    if (categoria) {
      where.categoria = {
        contains: categoria,
        mode: 'insensitive'
      };
    }

    // Buscar gastos
    const gastos = await req.prisma.gasto.findMany({
      where: {
        ...where,
        ...(categoria && { categoria: { contains: categoria, mode: 'insensitive' } })
      },
      orderBy: { data: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    // Buscar receitas
    const receitas = await req.prisma.receita.findMany({
      where: {
        usuarioId: userId,
        ...(dataInicio || dataFim ? { data: where.data } : {}),
        ...(categoria && { descricao: { contains: categoria, mode: 'insensitive' } })
      },
      orderBy: { data: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    // Transformar em formato unificado
    const gastosFormatted = gastos.map(gasto => ({
      id: `gasto_${gasto.id}`,
      tipo: 'gasto',
      valor: gasto.valor,
      categoria: gasto.categoria,
      descricao: gasto.categoria,
      data: gasto.data,
      usuarioId: gasto.usuarioId,
      criadoEm: gasto.data
    }));

    const receitasFormatted = receitas.map(receita => ({
      id: `receita_${receita.id}`,
      tipo: 'receita',
      valor: receita.valor,
      categoria: 'Receita',
      descricao: receita.descricao,
      data: receita.data,
      usuarioId: receita.usuarioId,
      criadoEm: receita.data
    }));

    // Combinar e ordenar por data
    const todasTransacoes = [...gastosFormatted, ...receitasFormatted]
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    // Estatísticas
    const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.valor, 0);
    const totalReceitas = receitas.reduce((sum, receita) => sum + receita.valor, 0);
    const saldo = totalReceitas - totalGastos;

    console.log(`✅ Encontradas ${todasTransacoes.length} transações`);
    console.log(`💰 Estatísticas: Gastos: R$ ${totalGastos}, Receitas: R$ ${totalReceitas}, Saldo: R$ ${saldo}`);

    // Sempre retornar estrutura consistente
    const responseData = {
      transacoes: todasTransacoes,
      estatisticas: {
        totalGastos: Number(totalGastos.toFixed(2)),
        totalReceitas: Number(totalReceitas.toFixed(2)),
        saldo: Number(saldo.toFixed(2)),
        quantidadeGastos: gastos.length,
        quantidadeReceitas: receitas.length,
        totalTransacoes: todasTransacoes.length
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: todasTransacoes.length
      }
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error);
    
    // Retornar estrutura padrão em caso de erro
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar as transações',
      data: {
        transacoes: [],
        estatisticas: {
          totalGastos: 0,
          totalReceitas: 0,
          saldo: 0,
          quantidadeGastos: 0,
          quantidadeReceitas: 0,
          totalTransacoes: 0
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 0
        }
      }
    });
  }
});

// GET /api/transactions/gastos - Buscar apenas gastos
router.get('/gastos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { categoria, dataInicio, dataFim } = req.query;

    const where = { usuarioId: userId };

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    if (categoria) {
      where.categoria = { contains: categoria, mode: 'insensitive' };
    }

    const gastos = await req.prisma.gasto.findMany({
      where,
      orderBy: { data: 'desc' }
    });

    res.json({
      success: true,
      data: gastos
    });

  } catch (error) {
    console.error('❌ Erro ao buscar gastos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar gastos'
    });
  }
});

// GET /api/transactions/receitas - Buscar apenas receitas
router.get('/receitas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { dataInicio, dataFim } = req.query;

    const where = { usuarioId: userId };

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    const receitas = await req.prisma.receita.findMany({
      where,
      orderBy: { data: 'desc' }
    });

    res.json({
      success: true,
      data: receitas
    });

  } catch (error) {
    console.error('❌ Erro ao buscar receitas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar receitas'
    });
  }
});

// POST /api/transactions/gastos - Criar novo gasto
router.post('/gastos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { valor, categoria, data } = req.body;

    if (!valor || !categoria) {
      return res.status(400).json({
        success: false,
        error: 'Valor e categoria são obrigatórios'
      });
    }

    const novoGasto = await req.prisma.gasto.create({
      data: {
        valor: parseFloat(valor),
        categoria,
        data: data ? new Date(data) : new Date(),
        usuarioId: userId
      }
    });

    console.log('💸 Novo gasto criado:', novoGasto.id);

    res.status(201).json({
      success: true,
      message: 'Gasto criado com sucesso',
      data: novoGasto
    });

  } catch (error) {
    console.error('❌ Erro ao criar gasto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar gasto'
    });
  }
});

// POST /api/transactions/receitas - Criar nova receita
router.post('/receitas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { valor, descricao, data } = req.body;

    if (!valor || !descricao) {
      return res.status(400).json({
        success: false,
        error: 'Valor e descrição são obrigatórios'
      });
    }

    const novaReceita = await req.prisma.receita.create({
      data: {
        valor: parseFloat(valor),
        descricao,
        data: data ? new Date(data) : new Date(),
        usuarioId: userId
      }
    });

    console.log('💰 Nova receita criada:', novaReceita.id);

    res.status(201).json({
      success: true,
      message: 'Receita criada com sucesso',
      data: novaReceita
    });

  } catch (error) {
    console.error('❌ Erro ao criar receita:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar receita'
    });
  }
});

// GET /api/transactions/stats - Estatísticas das transações
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { mes, ano } = req.query;

    // Definir período
    let dataInicio, dataFim;
    if (mes && ano) {
      dataInicio = new Date(ano, mes - 1, 1);
      dataFim = new Date(ano, mes, 0);
    } else {
      // Mês atual
      const agora = new Date();
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
    }

    // Buscar gastos do período
    const gastos = await req.prisma.gasto.findMany({
      where: {
        usuarioId: userId,
        data: {
          gte: dataInicio,
          lte: dataFim
        }
      }
    });

    // Buscar receitas do período
    const receitas = await req.prisma.receita.findMany({
      where: {
        usuarioId: userId,
        data: {
          gte: dataInicio,
          lte: dataFim
        }
      }
    });

    // Calcular estatísticas
    const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.valor, 0);
    const totalReceitas = receitas.reduce((sum, receita) => sum + receita.valor, 0);
    const saldo = totalReceitas - totalGastos;

    // Gastos por categoria
    const gastosPorCategoria = gastos.reduce((acc, gasto) => {
      acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.valor;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        periodo: {
          inicio: dataInicio,
          fim: dataFim
        },
        totais: {
          gastos: totalGastos,
          receitas: totalReceitas,
          saldo
        },
        quantidades: {
          gastos: gastos.length,
          receitas: receitas.length,
          transacoes: gastos.length + receitas.length
        },
        gastosPorCategoria
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    });
  }
});

export default router;