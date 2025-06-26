import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany({
    where: {
      nome: '',
      NOT: { telefone: null }
    }
  });

  for (const user of users) {
    const ultimos4 = user.telefone ? user.telefone.slice(-4) : '0000';
    await prisma.usuario.update({
      where: { id: user.id },
      data: { nome: `Usuário ${ultimos4}` }
    });
    console.log(`Usuário ID ${user.id} atualizado para Usuário ${ultimos4}`);
  }
  await prisma.$disconnect();
  console.log('Usuários sem nome corrigidos!');
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
