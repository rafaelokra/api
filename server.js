import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

 //Importar rotas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import transactionRoutes from './routes/transactions.js';  // ← ESTA É IMPORTANTE
import goalRoutes from './routes/goals.js';
import budgetRoutes from './routes/budgets.js';
import statsRoutes from './routes/stats.js';

// Configurar variáveis de ambiente
dotenv.config({ path: '../.env' });

// Teste se funcionou
console.log('DATABASE_URL encontrada:', process.env.DATABASE_URL ? 'SIM' : 'NÃO');
console.log('DATABASE_URL encontrada:', process.env.DATABASE_URL ? 'SIM' : 'NÃO');
console.log('Primeira parte da URL:', process.env.DATABASE_URL?.substring(0, 20));

// Inicializar Prisma
const prisma = new PrismaClient();

// Criar app Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para adicionar Prisma ao request
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

//Rotas da API
 app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);  // ← ESTA É IMPORTANTE
app.use('/api/goals', goalRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/stats', statsRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});   

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro na API:', err);
  
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Dados duplicados',
      message: 'Este registro já existe no banco de dados'
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro não encontrado',
      message: 'O registro solicitado não foi encontrado'
    });
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota 404 - CORRIGIDA!
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe`
  });
});

// Inicializar servidor
async function startServer() {
  try {
    // Testar conexão com banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 API disponível em: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();