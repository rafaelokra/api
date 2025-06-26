export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Transações da API',
      transactions: [
        {
          id: 1,
          description: 'Receita teste',
          amount: 1000,
          type: 'income',
          date: new Date().toISOString()
        }
      ]
    });
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}