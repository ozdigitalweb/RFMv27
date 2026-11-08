# NORMA DE DESENVOLVIMENTO: REBELDIA FM
Versão 1.0. Vale para TODA alteração neste projeto, sem exceção.

## CONTEXTO
Plataforma web e PWA da Rebeldia FM ("radio LIVRE"): React 19, TypeScript, Vite 6, Tailwind v4, Express 4, PostgreSQL com Drizzle ORM. Roda em produção em rebeldiafm.com.br, numa VPS com cPanel/Apache, que faz proxy reverso para um container Docker na porta 3000. O código vive no GitHub; o AI Studio publica na branch main. A estrutura do projeto está sendo reorganizada e esta norma define como.

---

## 1. PRINCÍPIOS GERAIS
- **1.1** Preserve layout, cores, animações, textos e dados oficiais (25 programas, 18 locutores, logos, canais Mixcloud). Nunca redesenhe telas nem remova funcionalidades sem pedido explícito.
- **1.2** Se uma correção exigir mudança visual, descreva-a no relatório e espere aprovação.
- **1.3** Antes de alterar, apresente um plano curto com os arquivos que serão mexidos. Em tarefas grandes, trabalhe por fases e pare ao final de cada uma para eu escrever "aprovado".
- **1.4** Ao concluir, responda sempre com: o que foi feito, arquivos alterados, o que NÃO foi feito, riscos e como testar.
- **1.5** Nunca declare "concluído" sem ter rodado lint e build.
- **1.6** Seja honesto sobre o que não verificou. Você só testa no ambiente do AI Studio; nunca afirme que algo funciona em produção.
- **1.7** Mudanças pequenas e focadas. Não refatore o que não foi pedido.

---

## 2. ESTRUTURA: UM MÓDULO POR FUNCIONALIDADE
- **2.1** Cada funcionalidade é um módulo independente: pedidos de música, mural de recados, promoções e sorteios, grade e hotsites, player, admin.
  - Front: `src/features/<nome>/` (`components/`, `api.ts`, `types.ts`)
  - Back: `server/features/<nome>/` (`routes.ts`, `schema.ts`, `migrations/`, `seed.ts`)
- **2.2** Cada módulo se registra em um único arquivo (`features/index.ts`).
- **2.3** Módulos NÃO importam uns aos outros. Só compartilham o que está em `core/` (`db`, `auth`, `config`, `health`, `media`).
- **2.4** `server.ts` e `App.tsx` ficam finos: apenas montam o app e registram os módulos.
- **2.5** Funcionalidade nova = copiar `_template`, preencher, registrar em uma linha. Mantenha `src/features/_template` e `server/features/_template` atualizados.
- **2.6** Ao mover código existente para módulos, não altere comportamento nem visual.
- **2.7** Uma tarefa deve tocar o mínimo de módulos possível, idealmente um só.

---

## 3. FEATURE FLAGS
- **3.1** Cada módulo tem um interruptor em `station_settings` (`feature.<nome> = true/false`), editável no painel admin.
- **3.2** Interface e rotas do módulo só ficam ativas quando a flag está ligada. Com a flag desligada, a API responde 404 e a interface não aparece.
- **3.3** Funcionalidade nova nasce DESLIGADA. Funcionalidade existente nasce LIGADA.
- **3.4** Nunca esconda código quebrado atrás de flag: ele precisa compilar e passar no lint.

---

## 4. FONTE DA VERDADE: BANCO DE DADOS
- **4.1** Todo dado compartilhado ou editável vive no PostgreSQL: programas, locutores, hotsites, fotos, bios, redes sociais, links Mixcloud, logo, banners, promoções, pedidos, votos, recados, curtidas, configurações, flags e hashes de senha.
- **4.2** `initialData.ts` e `officialData.ts` são só SEMENTE: inserem registros ausentes e NUNCA atualizam nem sobrescrevem registros existentes. Reiniciar o servidor jamais pode desfazer uma edição feita pelo admin ou por um locutor.
- **4.3** Proibido usar `localStorage`/`sessionStorage` para dados que precisam ser iguais para todos os visitantes. Permitido apenas para preferências por aparelho: volume, equalizador, sleep timer, despertador, marcação local de "já curti", rascunho de recado e aviso de instalação do PWA.
- **4.4** Curtidas e votos têm contagem e anti-duplicação no servidor (por usuário autenticado ou hash de IP). O `localStorage` só marca o botão.
- **4.5** Proibido URL ou número fixo no código (stream, WhatsApp, redes sociais, Mixcloud, imagens). Tudo vem de `station_settings` ou das tabelas e é editável no painel admin. `VITE_STREAM_URL` pode servir de valor padrão para o stream.
- **4.6** Imagens enviadas por admin e locutores ficam no banco (`bytea`), com limite de tamanho (500 KB), conversão para WebP e entrega por `/api/media/:id` com ETag e Cache-Control longo. Imagens do código-base ficam em `public/`.
- **4.7** Segredos (chaves de API, `DATABASE_URL`) ficam só em variáveis de ambiente, nunca no banco nem no Git.
- **4.8** Sem fallback embutido em produção. Se o banco falhar, `/api/health` informa, o log registra e o servidor tenta reconectar com espera, sem cair. O modo estático (sem backend) não é suportado.
- **4.9** Sem banco configurado (somente desenvolvimento), rode em memória e avise no log e em `/api/health` (db: `ok` | `memoria`).

---

## 5. BANCO: ESQUEMA E MIGRAÇÕES
- **5.1** A variável principal é `DATABASE_URL`. `SQL_*` é opcional e secundária.
- **5.2** Tabelas são criadas e alteradas por migrações numeradas e idempotentes (`0001_...`, `0002_...`), por módulo, aplicadas na inicialização e registradas em uma tabela de controle (`schema_migrations`).
- **5.3** PROIBIDO em migrações e seeds: `DROP`, `TRUNCATE`, recriar tabela, `DELETE` em massa, ou sobrescrever pedidos, recados, curtidas, votos e configurações.
- **5.4** Alterações de esquema devem ser aditivas (nova coluna com valor padrão, nova tabela). Mudança destrutiva exige autorização explícita e um script de backup antes.
- **5.5** Nunca escreva dados reais de ouvintes no repositório. `current_db_dump.json` e qualquer dump ficam no `.gitignore`.
- **5.6** Qualquer reescrita de dados de registros existentes exige migração de dados aprovada. O seed inicial jamais sobrescreve registros já persistidos no banco.

---

## 6. PRODUÇÃO E INFRAESTRUTURA
- **6.1** `NODE_ENV=production` serve apenas o build (`dist`). O Vite dev server nunca sobe em produção.
- **6.2** Use trust proxy (há Apache na frente), caminhos relativos (nada de URLs do ai.studio), CORS restrito ao domínio final configurável por variável, `/api/health` e encerramento limpo ao receber SIGTERM.
- **6.3** Mantenha na raiz: Dockerfile multi-stage, `docker-compose.yml` (app + `postgres:15-alpine`, volume nomeado, healthcheck, `restart: unless-stopped`, rotação de logs com max-size, porta publicada somente em `127.0.0.1:3000`), `.dockerignore`, `.gitignore`, `.env.example` completo e comentado, `package-lock.json` (usar `npm ci`).
- **6.4** Variáveis `VITE_*` entram no front na hora do build: declare-as como build args no Dockerfile e no compose.
- **6.5** Nunca versione `.env`, chaves ou senhas. `GEMINI_API_KEY` só no servidor, jamais com prefixo `VITE_`.
- **6.6** `firebase-applet-config.json` só pode conter a configuração pública do cliente web do Firebase.

---

## 7. ÁUDIO E DESEMPENHO
- **7.1** O áudio toca direto do Shoutcast no cliente (sem `/api/stream`), com conexão HTTPS e URL configurável em `station_settings`.
- **7.2** A rota de metadados é `/api/stream-metadata`, com cache de 10 a 15 segundos no servidor, para que muitos ouvintes não gerem consultas excessivas à origem do Shoutcast.
- **7.3** Service Worker versionado, com atualização automática (`skipWaiting` e `clients.claim`), que nunca guarda em cache `/api/*` nem o áudio.
- **7.4** Modais e telas pesadas com `React.lazy`; imagens com `loading="lazy"`; compressão e Cache-Control longo nos arquivos com hash.
- **7.5** O build deve exibir o tamanho do bundle. Nenhuma imagem em base64 dentro do código.

---

## 8. SEGURANÇA
- **8.1** Senhas de admin e de locutores com hash (scrypt) e sem valor padrão no código; a senha inicial do admin vem de variável de ambiente.
- **8.2** Todo POST público (pedidos, recados, votos, curtidas) tem validação de entrada e rate limit.
- **8.3** O mural sanitiza o conteúdo contra XSS. Use helmet.
- **8.4** Rotas de admin e de locutor exigem autenticação no servidor; esconder o botão na interface não conta como proteção.
- **8.5** Logs sem dados pessoais (e-mails, IPs completos, senhas, tokens).

---

## 9. GIT
- **9.1** Branches: `main` (integração, onde o AI Studio publica) e `production` (o que a VPS baixa, atualizada por Pull Request `main` -> `production`).
- **9.2** Nunca presuma outras branches e não tente criar nem trocar de branch.
- **9.3** Commits no padrão `feat(<modulo>): ...`, `fix(<modulo>): ...`, `chore: ...`, `docs: ...`, uma tarefa por commit sempre que possível.
- **9.4** Documente o fluxo em `CONTRIBUTING.md`, com modelo de Pull Request e checklist.
- **9.5** Funcionalidade nova entra na `main` com a flag desligada.

---

## 10. DOCUMENTAÇÃO
- **10.1** Mantenha `NORMAS.md` (esta norma), `CONTRIBUTING.md` e `README.md` atualizados na mesma tarefa que muda o comportamento.
- **10.2** O README deve refletir a realidade: React 19, stream de 64 kbps, branches `main` e `production`, banco como fonte da verdade, modo estático não suportado.
- **10.3** Mantenha `scripts/backup.sh` (pg_dump) e `scripts/restore.sh` funcionando.

---

## 11. DEFINIÇÃO DE PRONTO
Uma tarefa só está pronta quando: `npm run lint` e `npm run build` passam; `/api/health`, `/api/schedule` e `/api/settings` respondem; a funcionalidade tem flag, migração (se houver tabela) e seed idempotente; nenhum arquivo referenciado falta; `.env` e dumps não estão no Git; não há URL fixa nem localStorage indevido; e README/CONTRIBUTING refletem a mudança.

---

## 12. O QUE NUNCA FAZER
- Apagar, recriar ou sobrescrever dados.
- Mexer em layout sem aprovação.
- Versionar segredos ou dumps.
- Usar localStorage para dado compartilhado.
- Colocar URL ou número fixo no código.
- Importar entre módulos.
- Usar fallback embutido para esconder falha do banco.
- Deixar a produção sem `/api/health`.
- Afirmar que testou em produção.
- Criar ou trocar de branch.

---

## 13. COMO TRABALHAR COM ESTA NORMA
Se um pedido conflitar com esta norma, avisar o conflito e perguntar antes de agir. Se algo da norma for impossível no AI Studio, apontar o item e propor alternativa.
