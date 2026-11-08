# MANIFESTO DE ARQUITETURA & FLUXO FUNCIONAL COMPLETO
## Rebeldia FM - Plataforma Web & Mobile de Rádio Web

---

### 1. VISÃO GERAL DO PROJETO

A **Rebeldia FM** é uma plataforma digital completa de Web Rádio desenvolvida com arquitetura full-stack moderna. Combina streaming de áudio contínuo de alta fidelidade, processamento digital de sinal (DSP) no cliente com Web Audio API, interatividade social (pedidos de música, mural de recados e hotsites de programas) e um console administrativo completo com persistência em banco de dados relacional.

A aplicação foi projetada no formato SPA (Single Page Application) responsiva, operando tanto em navegadores desktop quanto móveis, suportando instalação PWA (Progressive Web App) e empacotamento para Android.

---

### 2. MAPEAMENTO COMPLETO DE DEPENDÊNCIAS (PACKAGE.JSON)

Abaixo estão todas as dependências do ecossistema e a função de cada uma:

#### Dependências Principais (`dependencies`):
| Pacote | Versão | Função e Responsabilidade |
| :--- | :--- | :--- |
| `react` | `^19.0.1` | Biblioteca base de interface declarativa reativa. |
| `react-dom` | `^19.0.1` | Renderizador do React para o DOM do navegador. |
| `express` | `^4.21.2` | Servidor backend HTTP para APIs REST, proxy de streaming e orquestração. |
| `drizzle-orm` | `^0.45.2` | ORM TypeScript type-safe para comunicação com banco de dados PostgreSQL. |
| `drizzle-kit` | `^0.31.10` | Ferramenta de migrações e geração de esquemas Drizzle. |
| `pg` | `^8.23.0` | Driver cliente nativo para PostgreSQL. |
| `@types/pg` | `^8.23.1` | Tipagens TypeScript para o driver `pg`. |
| `firebase` | `^12.18.0` | SDK cliente do Firebase para autenticação e armazenamento. |
| `firebase-admin` | `^14.3.0` | SDK backend do Firebase para verificação de credenciais e tokens. |
| `@google/genai` | `^2.4.0` | SDK oficial do Google Gemini AI para serviços generativos e assistentes. |
| `lucide-react` | `^0.546.0` | Biblioteca de ícones SVG consistentes e leves. |
| `motion` | `^12.23.24` | Biblioteca de animações e transições de layout fluidas (Motion/React). |
| `canvas-confetti` | `^1.9.4` | Efeitos visuais festivos para confirmações de pedidos e recados. |
| `@types/canvas-confetti` | `^1.9.0` | Tipagens para o pacote de confetes. |
| `dotenv` | `^17.2.3` | Carregamento seguro de variáveis de ambiente. |
| `vite` | `^6.2.3` | Bundler e ambiente de desenvolvimento ultrarrápido. |
| `@vitejs/plugin-react` | `^5.0.4` | Integração Vite para compilação de JSX/TSX com Fast Refresh. |
| `@tailwindcss/vite` | `^4.1.14` | Plugin oficial do Tailwind CSS v4 para compilação integrada com o Vite. |

#### Dependências de Desenvolvimento (`devDependencies`):
| Pacote | Versão | Função e Responsabilidade |
| :--- | :--- | :--- |
| `typescript` | `~5.8.2` | Compilador TypeScript com tipagem estrita em todo o código. |
| `tsx` | `^4.21.0` | Executor em tempo real de arquivos TypeScript no Node.js (`server.ts`). |
| `esbuild` | `^0.25.0` | Bundler de alto desempenho para empacotar o backend em `dist/server.cjs`. |
| `tailwindcss` | `^4.1.14` | Framework CSS utilitário para estilização consistente e responsiva. |
| `autoprefixer` | `^10.4.21` | Injeção automática de vendor-prefixes CSS. |
| `@types/node` | `^22.14.0` | Tipagens TypeScript para Node.js APIs (path, fs, process). |
| `@types/express` | `^4.17.21` | Tipagens TypeScript para requisições, respostas e middlewares Express. |

---

### 3. ÁRVORE DE ARQUIVOS E RESPONSABILIDADES TÉCNICAS

```text
.
├── .env.example                     # Declaração das variáveis de ambiente necessárias
├── .gitignore                       # Arquivos ignorados pelo controle de versão
├── firebase-applet-config.json      # Configuração de provisionamento Firebase
├── index.html                       # Entrypoint HTML com fontes, meta tags e manifest PWA
├── metadata.json                    # Metadados do app para a infraestrutura Google AI Studio
├── package.json                     # Declaração de scripts e dependências
├── server.ts                        # Servidor Express Full-Stack e APIs REST
├── tsconfig.json                    # Configurações do compilador TypeScript
├── vite.config.ts                   # Configurações do pipeline de build do Vite
├── public/                          # Ativos estáticos públicos
│   ├── android-mascot.svg           # Ícone do robô Android
│   ├── logo-icon.svg                # Ícone simplificado da marca RFM
│   ├── logo.svg                     # Vetor oficial da marca Rebeldia FM
│   ├── manifest.json                # Manifesto PWA com metadados para instalação no celular
│   ├── mascote-rfm.jpg              # Mascote oficial da rádio
│   ├── reb_mascot.jpg               # Imagem complementar do mascote
│   └── sw.js                        # Service Worker para cache e suporte offline PWA
└── src/                             # Código-fonte principal da aplicação
    ├── App.tsx                      # Componente raiz, orquestrador de estado global e navegação
    ├── index.css                    # Folha de estilo global com importação Tailwind v4
    ├── main.tsx                     # Ponto de montagem React DOM
    ├── types.ts                     # Definições de interfaces e tipos TypeScript
    ├── components/                  # Componentes visuais e modais
    │   ├── AdminBannersSection.tsx  # Gestão de banners, campanhas e patrocinadores
    │   ├── AdminManagerModal.tsx    # Painel administrativo mestre (grade, moderação, configs)
    │   ├── AlarmClockModal.tsx      # Modal de configuração do despertador matinal com rádio
    │   ├── AndroidIcon.tsx          # Componente SVG do ícone do Android
    │   ├── ColorPaletteModal.tsx    # Modal de seleção de temas de cores dinâmicos
    │   ├── FeaturesSuggestionModal.tsx # Central de feedback e sugestão de melhorias
    │   ├── GlobalPlayerBar.tsx      # Mini player persistente no rodapé com todos os controles
    │   ├── HostAuthModal.tsx        # Modal de login seguro para locutores e administradores
    │   ├── InstallModal.tsx         # Instruções de instalação PWA e download do app Android
    │   ├── InstitutionalView.tsx    # Página institucional (História, Manifesto, Contatos)
    │   ├── LiveTakeoverModal.tsx    # Modal de intervenção ao vivo e avisos especiais
    │   ├── LogoUploader.tsx         # Módulo para upload e corte do logotipo da rádio
    │   ├── MuralBoard.tsx           # Mural de recados comunitário com reações e moderação
    │   ├── ProgramHotsiteModal.tsx  # Hotsite dinâmico individual para cada programa/locutor
    │   ├── PromoBannerCard.tsx      # Card de destaque promocional na página principal
    │   ├── PromoModal.tsx           # Visualizador de detalhes de promoções
    │   ├── RebeldiaLogo.tsx         # Renderizador adaptativo da logomarca (SVG ou customizada)
    │   ├── ScheduleView.tsx         # Grade semanal de programação com badge "AO VIVO"
    │   ├── SettingsModal.tsx        # Configurações de áudio, DSP, equalizador e servidores
    │   ├── SleepTimerModal.tsx      # Temporizador de desligamento automático da rádio
    │   ├── SongRequestsModal.tsx    # Formulário e histórico de pedidos de músicas com busca
    │   └── Visualizer.tsx           # Analisador gráfico de espectro de áudio em tempo real
    ├── context/
    │   └── AuthContext.tsx          # Provedor React de autenticação (usuário comum / locutor / admin)
    ├── data/
    │   ├── initialData.ts           # Grade inicial padrão da programação e locutores
    │   └── institutional.ts         # Textos institucionais e manifesto da rádio
    ├── db/                          # Camada de banco de dados
    │   ├── drizzle.config.ts        # Configuração do Drizzle ORM
    │   ├── index.ts                 # Pool de conexão com o banco PostgreSQL
    │   ├── schema.ts                # Tabelas: users, schedule, song_requests, shoutouts, settings
    │   └── users.ts                 # Utilitários de busca e criação de usuários
    ├── lib/                         # Integrações de SDKs de terceiros
    │   ├── firebase.ts              # Inicialização do Firebase Client SDK
    │   └── firebase-admin.ts        # Inicialização do Firebase Admin SDK
    ├── middleware/
    │   └── auth.ts                  # Middlewares Express de autenticação de rotas
    ├── services/
    │   └── musicApi.ts              # Integração de busca com APIs de música e metadados
    └── utils/                       # Utilitários de lógica e engenharia
        ├── api.ts                   # Cliente HTTP tipado para o backend
        ├── audioEngine.ts           # Motor de áudio Web Audio API (filtros de frequência)
        ├── logo.ts                  # Persistência e gerenciamento do logotipo
        └── theme.ts                 # Dicionário de paletas de cores e temas claro/escuro
```

---

### 4. FLUXO FUNCIONAL DE TODAS AS ÁREAS DO APP

#### A. Fluxo de Streaming e Processamento de Áudio
1. **Inicialização do Áudio**: O motor `audioEngine.ts` instancia um elemento `<audio>` nativo com suporte a reconexão automática e buffer resiliente.
2. **Web Audio DSP & Equalizador**: O áudio passa por um nó de processamento `AudioContext` conectado a uma cadeia de 5 filtros biquadráticos (`BiquadFilterNode`):
   - *Sub Graves (Low Shelf 60Hz)*
   - *Médios Graves (Peaking 250Hz)*
   - *Médios Vocais (Peaking 1kHz)*
   - *Médios Agudos (Peaking 4kHz)*
   - *Agudos e Brilho (High Shelf 12kHz)*
3. **Presets do Equalizador**: Disponíveis em 2 colunas organizadas: *Padrão (Flat)*, *Mega Graves (Bass Boost)*, *Rock & Guitarras*, *Voz & Pop*, *Eletrônica & Club*, *Locução & Notícias*.
4. **Metadados em Tempo Real**: Um serviço em segundo plano consulta a cada 8 segundos os metadados do Shoutcast/Icecast para extrair faixa atual e artista, buscando a arte oficial da capa via iTunes Search API com cache inteligente.

#### B. Fluxo de Controles de Áudio: Mini Player, Despertador e Sleep Timer
1. **Mini Player Global (`GlobalPlayerBar.tsx`)**:
   - Fixo na base da tela, permanece visível em todas as abas.
   - Apresenta: Capa do álbum, faixa, artista, botão Play/Pause central, controle de volume deslizante, botão de pedido rápido, botão de despertador (sino com indicador ativo), botão de sleep timer (lua) e equalizador (sliders).
2. **Despertador da Rádio (`AlarmClockModal.tsx`)**:
   - O usuário escolhe horário, dias da semana e intensidade do alarme.
   - Ao disparar no horário agendado, a rádio inicia a reprodução do streaming automaticamente ou toca o sinal de rádio programado.
3. **Sleep Timer (`SleepTimerModal.tsx`)**:
   - Permite programar o desligamento automático em 15, 30, 45, 60 ou 90 minutos.
   - Um contador regressivo é exibido no botão do mini player, pausando o áudio suavemente ao final do ciclo.

#### C. Fluxo de Interatividade: Pedidos de Música & Mural
1. **Pedidos de Música (`SongRequestsModal.tsx`)**:
   - O ouvinte digita o nome da música ou artista; o app consulta a API de músicas e traz sugestões com capa e prévia de áudio de 30s.
   - O pedido é gravado no banco de dados com status `pendente`, podendo ser aprovado ou recusado pelo locutor no painel administrativo.
2. **Mural de Recados (`MuralBoard.tsx`)**:
   - Os ouvintes enviam mensagens com nome, cidade e mensagem.
   - Mensagens entram em tempo real e podem receber reações (corações, palmas, fogo).
   - Inclui proteção com filtro antispam e moderação administrativa.

#### D. Fluxo de Conteúdo: Grade de Programação & Hotsites dos Programas
1. **Grade Semanal (`ScheduleView.tsx`)**:
   - Organizada por dias da semana (Segunda a Domingo).
   - Calcula em tempo real o programa ativo no momento com o selo animado `"NO AR"`.
2. **Hotsites Individuais (`ProgramHotsiteModal.tsx`)**:
   - Cada atração possui um hotsite próprio detalhado com: bio do apresentador, horários, galeria de fotos, links de redes sociais, vídeos em destaque e atalho direto para falar com o locutor no WhatsApp.

#### E. Fluxo Administrativo & Gestão (`AdminManagerModal.tsx`)
1. **Autenticação**: Acesso restrito via senha mestre ou login de locutor.
2. **Gerenciador da Grade**: Criação, edição e exclusão de programas e horários.
3. **Moderação de Pedidos e Mural**: Aprovação ou exclusão de recados e pedidos em 1 clique.
4. **Banners & Patrocinadores**: Upload e agendamento de banners promocionais e links de apoiadores.
5. **Configurações Gerais**: Edição do slogan, URL de streaming, WhatsApp e contatos da estação, persistidos na tabela `station_settings`.

#### F. Fluxo de Identidade Visual e Temas (`theme.ts` & `ColorPaletteModal.tsx`)
- **Identidade Principal da Marca (Rock Rebeldia)**:
  - Primária: **Âmbar Dourado Rock** `#F59E0B` (`rgb(245, 158, 11)`)
  - Secundária: **Vermelho Rock (No Ar)** `#EF4444` (`rgb(239, 68, 68)`)
  - Acento: **Laranja Solar** `#F97316` (`rgb(249, 115, 22)`)
  - Fundo Canvas: **Obsidian Profundo** `#09090B` (`rgb(9, 9, 11)`)
  - Cards & Superfícies: `rgba(18, 18, 22, 0.85)` com backdrop blur
  - Tipografia: `#F4F4F5` (Texto principal) e `#A1A1AA` (Subtítulos)
- Suporte a múltiplas paletas temáticas com adaptação automática de contraste:
  - *Âmbar Rock Clássico* (`#F59E0B`)
  - *Cyber Violet & Forest* (`#6B256F`, `#194B32`, `#93B4DB`)
  - *Sunset Vintage & Terracotta* (`#FFB400`, `#FF6333`, `#BE1E1C`)
  - *Pop CMYK Studio* (`#E62B6E`, `#1C75BC`, `#FFB800`)
  - *Neon Electric Wave* (`#3B82F6`, `#C850A0`, `#F59E0B`)
- Suporte a alternância entre modo escuro (Dark Mode padrão da rádio) e modo claro de alta legibilidade.
- **Arquivo Oficial de Diretrizes de Marca**: Consulte o arquivo dedicado `MANIFESTO_REBELDIA_FM.md` na raiz do projeto para o guia visual completo com tokens CSS prontos para uso.

---

### 5. ROTEIRO DE EVOLUÇÃO SUGERIDO (PRÓXIMAS ETAPAS)

1. **Gravação e Podcasts**: Adicionar aba de episódios sob demanda e gravações dos melhores momentos dos programas.
2. **Notificações Push Reais**: Integração com Web Push Notifications via Firebase Cloud Messaging para alertar quando o programa favorito começar.
3. **Chat de Ouvintes em Tempo Real**: Adicionar sala de bate-papo simultânea durante os programas ao vivo usando WebSockets.
4. **Modo Economia de Dados**: Opção para alternar entre stream HD (128kbps/320kbps) e stream Econômico (32kbps/64kbps) para redes móveis 3G/4G.
5. **CarPlay e Android Auto**: Suporte a metadados no MediaSession API para exibição nos computadores de bordo automotivos.

---

### 6. INSTRUÇÕES DE DOWNLOAD

- **Arquivo deste Manifesto**: Você pode baixar o arquivo físico deste documento a qualquer momento acessando no seu navegador a rota:
  `GET /api/manifesto/download`
- **Código-Fonte Completo do Projeto**:
  - No menu do Google AI Studio, utilize a opção **Export to ZIP** ou **Export to GitHub** para obter o repositório completo compactado pronto para execução local com `npm install` e `npm run dev`.
