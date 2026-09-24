import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { subir, cliente } from './ajuda.js';

let T;
before(async () => { T = await subir({ acessoRestrito: 'equipe:senha-do-teste' }); });
after(() => T?.descer());

const basico = s => ({ authorization: 'Basic ' + Buffer.from(s).toString('base64') });

test('site de teste: sem a senha de acesso, nem a tela de login aparece', async () => {
  const c = cliente(T.app);
  for (const url of ['/', '/entrar', '/cadastro', '/m/involutivo/index.html', '/publico/casca.css']) {
    const r = await c.get(url);
    assert.equal(r.statusCode, 401, url);
    assert.match(r.headers['www-authenticate'], /^Basic realm=/);
  }
  assert.equal((await c.get('/entrar', { headers: basico('equipe:errada') })).statusCode, 401);
  assert.equal((await c.get('/entrar', { headers: basico('equipe:senha-do-teste') })).statusCode, 200);
});

test('site de teste: a hospedagem confere a saúde sem senha', async () => {
  assert.equal((await cliente(T.app).get('/saude')).statusCode, 200);
});

test('com a senha de acesso, o login continua valendo por cima', async () => {
  const c = cliente(T.app);
  const h = { headers: basico('equipe:senha-do-teste') };
  assert.equal((await c.get('/modelagens', h)).statusCode, 302);
});
