import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Listar metas do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const metas = await req.prisma.meta.findMany({
      where: { usuarioId: req.user.id },
      orderBy: { criadaEm: 'desc' }
    });

    res.json({
      success: true,
      metas
    });
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao buscar metas'
    });
  }
});

// Criar meta
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nome, valorMeta, categoria, prazo, tipo, descricao } = req.body;

    if (!nome || !valorMeta || !categoria || !prazo || !tipo) {
      return res.status(400).json({
        error: 'Dados obrigatórios',
        message: 'Nome, valor da meta, categoria, prazo e tipo são obrigatórios'
      });
    }

    const meta = await req.prisma.meta.create({
      data: {
        nome,
        valorMeta: parseFloat(valorMeta),
        categoria,
        prazo: new Date(prazo),
        tipo: tipo.toUpperCase(),
        descricao,
        usuarioId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Meta criada com sucesso',
      meta
    });
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao criar meta'
    });
  }
});

// Atualizar meta
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, valorMeta, categoria, prazo, tipo, descricao, ativo, concluida } = req.body;

    const meta = await req.prisma.meta.update({
      where: { 
        id,
        usuarioId: req.user.id
      },
      data: {
        ...(nome && { nome }),
        ...(valorMeta && { valorMeta: parseFloat(valorMeta) }),
        ...(categoria && { categoria }),
        ...(prazo && { prazo: new Date(prazo) }),
        ...(tipo && { tipo: tipo.toUpperCase() }),
        ...(descricao !== undefined && { descricao }),
        ...(ativo !== undefined && { ativo }),
        ...(concluida !== undefined && { concluida })
      }
    });

    res.json({
      success: true,
      message: 'Meta atualizada com sucesso',
      meta
    });
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao atualizar meta'
    });
  }
});

// Deletar meta
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.meta.delete({
      where: { 
        id,
        usuarioId: req.user.id
      }
    });

    res.json({
      success: true,
      message: 'Meta deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao deletar meta'
    });
  }
});

export default router;