// Mock da valle-api para renderizar o front-end sem Firebase.
import http from 'node:http';

const PORT = 3000;
const now = new Date();
const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

function jwt(payload) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

const users = [
  { id: 'admin1', name: 'Caio Valle', email: 'admin@valle.com', joinDate: '2023-01-10T00:00:00.000Z', status: 'Ativo', role: 'admin', totalInvestido: 0 },
  { id: 'c1', name: 'Maria Fernanda Alves', email: 'maria@exemplo.com', joinDate: '2024-02-15T00:00:00.000Z', status: 'Ativo', role: 'client', totalInvestido: 248310.55, participationPercent: 31.2 },
  { id: 'c2', name: 'Ricardo Souza', email: 'ricardo@exemplo.com', joinDate: '2024-05-03T00:00:00.000Z', status: 'Ativo', role: 'client', totalInvestido: 182900.10, participationPercent: 23.0 },
  { id: 'c3', name: 'Ana Paula Ribeiro', email: 'ana@exemplo.com', joinDate: '2024-09-21T00:00:00.000Z', status: 'Ativo', role: 'client', totalInvestido: 156420.00, participationPercent: 19.7 },
  { id: 'c4', name: 'João Pedro Martins', email: 'joao@exemplo.com', joinDate: '2025-01-08T00:00:00.000Z', status: 'Ativo', role: 'client', totalInvestido: 121000.00, participationPercent: 15.2 },
  { id: 'c5', name: 'Beatriz Nogueira', email: 'bia@exemplo.com', joinDate: '2025-03-12T00:00:00.000Z', status: 'Ativo', role: 'client', totalInvestido: 86500.00, participationPercent: 10.9 },
  { id: 'c6', name: 'Carlos Eduardo Lima', email: 'cadu@exemplo.com', joinDate: '2024-11-02T00:00:00.000Z', status: 'Inativo', role: 'client', totalInvestido: 0, participationPercent: 0 },
];

function monthsBack(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return out;
}

const fundMonthly = [1.4, 0.9, -0.6, 2.1, 1.7, 0.4, 1.9, -1.1, 2.4, 1.2, 0.8, 1.6, 1.1, 2.0, 0.7, 1.3, 1.8, 0.5, 2.2, -0.4];
const cdiMonthly  = [0.97, 0.92, 1.05, 0.89, 1.01, 0.96, 1.10, 0.93, 1.02, 0.99, 0.95, 1.06, 1.01, 0.98, 1.04, 0.97, 1.02, 0.99, 1.06, 0.94];
const ibovMonthly = [3.1, -4.2, 1.8, 0.5, -2.9, 6.1, 2.2, -1.7, 3.6, -0.8, 4.4, -3.3, 1.2, 5.0, -2.1, 0.9, 3.8, -1.4, 2.6, 1.1];

function series(n) {
  const rel = monthsBack(n);
  const cat = ['Início', ...rel.map(m => `${months[m.month]}/${String(m.year).slice(-2)}`)];
  const acc = (arr) => {
    let f = 1; const out = [0];
    for (let i = 0; i < n; i++) { f *= 1 + arr[i % arr.length] / 100; out.push(+((f - 1) * 100).toFixed(2)); }
    return out;
  };
  return { rel, categories: cat, fundo: acc(fundMonthly), cdi: acc(cdiMonthly), ibov: acc(ibovMonthly) };
}

function tableData(n) {
  const { rel } = series(n);
  const years = [...new Set(rel.map(m => m.year))].sort();
  return years.map(year => {
    const mk = (arr) => {
      const mv = new Array(12).fill(null);
      rel.forEach((m, i) => { if (m.year === year) mv[m.month] = arr[i % arr.length]; });
      const valid = mv.filter(v => v !== null);
      const annual = valid.length ? (valid.reduce((a, r) => a * (1 + r / 100), 1) - 1) * 100 : 0;
      return { monthlyValues: mv, annualTotal: annual };
    };
    return { year, items: [
      { label: 'Minha Carteira', ...mk(fundMonthly) },
      { label: 'CDI', ...mk(cdiMonthly) },
      { label: 'Ibovespa', ...mk(ibovMonthly) },
    ] };
  }).reverse();
}

const iso = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString();
const d = (mAgo, day) => { const t = new Date(now.getFullYear(), now.getMonth() - mAgo, 1); return iso(t.getFullYear(), t.getMonth(), day); };

const transactions = [
  { id: 't1', data: d(0, 3),  clientId: 'c2', clientName: 'Ricardo Souza',        tipo: 'Aporte',  valor: 25000,   status: 'Pendente' },
  { id: 't2', data: d(0, 1),  clientId: 'c4', clientName: 'João Pedro Martins',   tipo: 'Resgate', valor: 8000,    status: 'Pendente' },
  { id: 't3', data: d(0, 5),  clientId: 'c1', clientName: 'Maria Fernanda Alves', tipo: 'Rendimento', valor: 3120.40, status: 'Aprovado' },
  { id: 't4', data: d(1, 18), clientId: 'c1', clientName: 'Maria Fernanda Alves', tipo: 'Aporte',  valor: 50000,   status: 'Aprovado' },
  { id: 't5', data: d(1, 9),  clientId: 'c3', clientName: 'Ana Paula Ribeiro',    tipo: 'Resgate', valor: 12000,   status: 'Aprovado' },
  { id: 't6', data: d(2, 22), clientId: 'c5', clientName: 'Beatriz Nogueira',     tipo: 'Aporte',  valor: 30000,   status: 'Aprovado' },
  { id: 't7', data: d(2, 4),  clientId: 'c2', clientName: 'Ricardo Souza',        tipo: 'Aporte',  valor: 15000,   status: 'Negado' },
  { id: 't8', data: d(3, 14), clientId: 'c4', clientName: 'João Pedro Martins',   tipo: 'Aporte',  valor: 121000,  status: 'Aprovado' },
  { id: 't9', data: d(4, 2),  clientId: 'c1', clientName: 'Maria Fernanda Alves', tipo: 'Aporte',  valor: 100000,  status: 'Aprovado' },
  { id: 't10', data: d(6, 11), clientId: 'c3', clientName: 'Ana Paula Ribeiro',   tipo: 'Aporte',  valor: 150000,  status: 'Aprovado' },
  { id: 't11', data: d(8, 27), clientId: 'c2', clientName: 'Ricardo Souza',       tipo: 'Aporte',  valor: 160000,  status: 'Aprovado' },
  { id: 't12', data: d(12, 6), clientId: 'c1', clientName: 'Maria Fernanda Alves', tipo: 'Aporte', valor: 90000,   status: 'Aprovado' },
];

const fundOps = Array.from({ length: 14 }, (_, i) => {
  const inv = 40000 + (i * 7919) % 60000;
  const res = [3200, -1450, 5100, 2650, -800, 4100, 1900, 6200, -2100, 3300, 2700, 4800, -600, 3900][i];
  return { id: `op${i}`, data: d(Math.floor(i / 2), 26 - i), descricao: ['Trade PETR4','Swing VALE3','Opções BOVA11','Trade ITUB4','Day trade WINFUT','Swing MGLU3','Trade BBAS3','Opções PETR4','Trade WEGE3','Swing PRIO3','Trade ELET3','Trade SUZB3','Swing RENT3','Trade BBDC4'][i], valorInvestido: inv, valorVenda: inv + res, resultado: res };
});

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const p = url.pathname;
  if (req.method === 'OPTIONS') return json(res, 204);
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    console.log(req.method, p, url.search);
    const session = (user) => ({ access_token: jwt({ sub: user.id, role: user.role, email: user.email, exp: Math.floor(Date.now() / 1000) + 86400 }), user });
    const bearerUser = () => {
      try {
        const payload = JSON.parse(Buffer.from((req.headers.authorization || '').split('.')[1] || '', 'base64').toString() || '{}');
        return users.find(u => u.id === payload.sub);
      } catch { return undefined; }
    };

    // Login com senha: qualquer senha vale; o email escolhe o usuário (default: cliente c1).
    if (p === '/auth/login' && req.method === 'POST') {
      const { email } = JSON.parse(body || '{}');
      const user = users.find(u => u.email === email) || users[1];
      return json(res, 200, session(user));
    }
    if (p === '/auth/me' && req.method === 'GET') {
      const user = bearerUser();
      return user ? json(res, 200, user) : json(res, 401, { message: 'Unauthorized' });
    }
    if (['/auth/forgot-password', '/auth/reset-password', '/auth/invite/resend'].includes(p) && req.method === 'POST') {
      return json(res, 200, { message: 'ok (mock)' });
    }
    if (p === '/auth/password' && req.method === 'PATCH') return json(res, 200, { message: 'Senha alterada com sucesso.' });
    if (p === '/auth/verify-token' && req.method === 'POST') {
      const { token } = JSON.parse(body || '{}');
      return json(res, 200, session(token === 'admin' ? users[0] : users[1]));
    }
    if (p === '/clients' && req.method === 'GET') return json(res, 200, users);
    if (p.startsWith('/clients/') && req.method === 'GET') {
      const u = users.find(x => x.id === p.split('/')[2]);
      return u ? json(res, 200, u) : json(res, 404, { message: 'not found' });
    }
    if (p === '/performance/admin/summary') {
      const n = url.searchParams.get('periodo') === 'Mês' ? 1 : 20;
      const s = series(n);
      const twr = s.fundo.at(-1) / 100;
      return json(res, 200, {
        kpis: { saldoLivre: 0, saldoInvestido: 795130.65, patrimonioTotal: 795130.65, lucroPercentual: twr, totalOperacoes: n === 1 ? 2 : 14, usuariosAtivos: 5 },
        rendimento: { lucroReais: 34800, lucroPercentual: twr, percentualSobreCDI: twr / (s.cdi.at(-1) / 100), percentualSobreIbov: twr / (s.ibov.at(-1) / 100) },
        chartData: { categories: s.categories, series: [{ name: 'Fundo', data: s.fundo }, { name: 'CDI', data: s.cdi }, { name: 'Ibovespa', data: s.ibov }] },
      });
    }
    if (p.startsWith('/performance/')) {
      const n = url.searchParams.get('periodo') === 'Mês' ? 1 : 20;
      const s = series(n);
      const twr = s.fundo.at(-1) / 100;
      return json(res, 200, {
        cardData: { saldoAtual: 248310.55, rendimentoReais: n === 1 ? 3120.40 : 38310.55, rentabilidadePercentual: twr, percentualSobreCDI: twr / (s.cdi.at(-1) / 100), percentualSobreIbov: twr / (s.ibov.at(-1) / 100) },
        chartData: { categories: s.categories, series: [{ name: 'Minha Carteira', data: s.fundo }, { name: 'CDI', data: s.cdi }, { name: 'Ibovespa', data: s.ibov }] },
        tableData: tableData(n),
      });
    }
    if (p === '/client-transactions/pending/count') return json(res, 200, { count: 2 });
    if (p === '/client-transactions' && req.method === 'GET') {
      const cid = url.searchParams.get('clientId');
      return json(res, 200, cid ? transactions.filter(t => t.clientId === cid) : transactions);
    }
    if (p === '/fund-operations' && req.method === 'GET') {
      const page = +(url.searchParams.get('page') || 1), limit = +(url.searchParams.get('limit') || 10);
      return json(res, 200, { data: fundOps.slice((page - 1) * limit, page * limit), total: fundOps.length });
    }
    if (['POST', 'PATCH', 'PUT'].includes(req.method)) return json(res, 201, { id: 'new', ...JSON.parse(body || '{}') });
    if (req.method === 'DELETE') return json(res, 204);
    json(res, 404, { message: `no mock for ${req.method} ${p}` });
  });
}).listen(PORT, '127.0.0.1', () => console.log(`mock api on http://127.0.0.1:${PORT}`));
