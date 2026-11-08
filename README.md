# 🎸 Rebeldia FM — Plataforma Web & Mobile de Rádio Digital

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js & Express](https://img.shields.io/badge/Node.js-Express_4-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://orm.drizzle.team/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Admin-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-DSP_%26_Equalizer-FF5722?style=for-the-badge&logo=audio-technica&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![PWA Ready](https://img.shields.io/badge/PWA-Android_%26_iOS-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

Plataforma oficial full-stack da **Rebeldia FM** (*"radio LIVRE"*). Uma aplicação web moderna e progressiva (PWA) de alta performance, desenvolvida para streaming contínuo de áudio HD, processamento digital de sinal (DSP), interatividade em tempo real com ouvintes, hotsites dedicados para locutores, grade semanal dinâmica e painel administrativo completo. VAMO DALE !!!

---

## 📑 Sumário

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica Completa](#-stack-tecnológica-completa)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Recursos e Funcionalidades](#-recursos-e-funcionalidades)
- [Motor de Áudio & DSP (Web Audio API)](#-motor-de-áudio--dsp-web-audio-api)
- [PWA & Suporte Mobile](#-pwa--suporte-mobile)
- [Banco de Dados & Esquema (Drizzle ORM)](#-banco-de-dados--esquema-drizzle-orm)
- [APIs & Rotas do Servidor](#-apis--rotas-do-servidor)
- [Estrutura de Pastas e Arquivos](#-estrutura-de-pastas-e-arquivos)
- [Instalação e Execução Local](#-instalação-e-execução-local)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts do Projeto](#-scripts-do-projeto)
- [Licença](#-licença)

---

## 📻 Visão Geral

A **Rebeldia FM** nasceu com o compromisso de defender a liberdade de expressão, a diversidade musical e a valorização da cultura independente sem jabá. Esta plataforma conecta a transmissão ao vivo de áudio (Icecast/Shoutcast) a uma suíte de ferramentas modernas para ouvintes, comunicadores e administradores:

- **Streaming Contínuo**: Reprodução ininterrupta entre abas com reconexão automática e sincronização de metadados em tempo real (música e artista no ar).
- **Processamento de Áudio no Cliente**: Equalizador paramétrico multibanda, visualizadores de espectro/VU em tempo real e controle de ganho via Web Audio API.
- **Interatividade Total**: Pedidos de música com prévia de áudio de 1:30s e bio da banda, mural comunitário de recados com reações, e integração direta com WhatsApp.
- **Hotsite Dinâmico por Programa**: Cada atração da grade possui página própria com biografia, galeria de fotos, vídeos, playlists, podcasts/gravações Mixcloud e área de edição exclusiva para o locutor via senha.
- **Painel Administrativo**: Controle integral da rádio, agendamento de reprises, banners rotativos de patrocinadores, aviso de intervenção ao vivo (*Live Takeover*) e gestão de locutores.

---

## 🛠 Stack Tecnológica Completa

### 1. Frontend & UI
| Tecnologia | Versão | Propósito / Aplicação |
| :--- | :--- | :--- |
| **React** | `^19.0.1` | Biblioteca central para interface declarativa reativa baseada em componentes. |
| **React DOM** | `^19.0.1` | Renderização otimizada para o DOM web. |
| **TypeScript** | `~5.8.2` | Tipagem estática rigorosa em todo o frontend e backend. |
| **Vite** | `^6.2.3` | Bundler e build tool ultrarrápido com Hot Module Replacement (HMR). |
| **Tailwind CSS v4** | `^4.1.14` | Framework utilitário de estilização compilado via `@tailwindcss/vite`. |
| **Motion (Framer Motion)**| `^12.23.24` | Animações fluidas, transições de modais e componentes interativos. |
| **Lucide React** | `^0.546.0` | Conjunto leve e consistente de ícones vetoriais SVG. |
| **Canvas Confetti** | `^1.9.4` | Feedback visual comemorativo para votos, pedidos e recados. |
| **jsPDF** | `^4.2.1` | Geração client-side de PDFs para o Manifesto de Marca e Mídia Kit oficial. |

### 2. Backend & Infraestrutura
| Tecnologia | Versão | Propósito / Aplicação |
| :--- | :--- | :--- |
| **Node.js** | `>=20.x` | Ambiente de execução JavaScript server-side. |
| **Express** | `^4.21.2` | Servidor web HTTP, endpoints REST, proxy de áudio e middlewares de segurança. |
| **tsx** | `^4.21.0` | Execução direta de TypeScript em ambiente de desenvolvimento sem etapa de build prévia. |
| **esbuild** | `^0.25.0` | Compilação e empacotamento ultrarrápido do servidor para produção (`dist/server.cjs`). |
| **dotenv** | `^17.2.3` | Gerenciamento e injeção de variáveis de ambiente. |

### 3. Banco de Dados & Autenticação
| Tecnologia | Versão | Propósito / Aplicação |
| :--- | :--- | :--- |
| **PostgreSQL** | `>=15` | Banco de dados relacional robusto para grade, pedidos, mural e configurações. |
| **pg** | `^8.23.0` | Driver nativo de alta performance para conexão com PostgreSQL. |
| **Drizzle ORM** | `^0.45.2` | ORM type-safe TypeScript com queries limpas e relacionamentos explícitos. |
| **Drizzle Kit** | `^0.31.10` | CLI para migrações de esquema e gerenciamento do banco. |
| **Firebase Client SDK** | `^12.18.0` | Autenticação Google dos ouvintes e integração Firestore opcional. |
| **Firebase Admin SDK** | `^14.3.0` | Validação de tokens JWT e gestão administrativa no backend. |

### 4. Inteligência Artificial
| Tecnologia | Versão | Propósito / Aplicação |
| :--- | :--- | :--- |
| **@google/genai** | `^2.4.0` | SDK oficial do Google Gemini API para automação e assistência inteligente. |

---

## 🏗 Arquitetura do Sistema

```
                      ┌──────────────────────────────────────┐
                      │    Navegador / Dispositivo Móvel     │
                      │  (PWA / Android / iOS / Desktop)     │
                      └──────────────────┬───────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       ┌──────────────────────┐                     ┌──────────────────────┐
       │   React 19 SPA UI    │                     │ Web Audio API Engine │
       │  (Tailwind v4 + SVG) │                     │ (EQ, Analyser, DSP)  │
       └───────────┬──────────┘                     └──────────┬───────────┘
                   │                                           │
                   │ HTTP / JSON REST                          │ Stream Áudio
                   ▼                                           ▼
       ┌───────────────────────────────────────────────────────────────┐
       │                 Express Full-Stack Server                     │
       │   - Proxy de Áudio & Bypass CORS (/api/stream)                │
       │   - Scraper de Metadados Icecast/Shoutcast (/api/metadata)   │
       │   - APIs de Pedidos, Mural, Grade e Banners                   │
       │   - Autenticação JWT Firebase & Senhas de Locutores           │
       └──────────────┬───────────────────────────────┬────────────────┘
                      │                               │
                      ▼                               ▼
       ┌──────────────────────────────┐ ┌──────────────────────────────┐
       │ PostgreSQL (via Drizzle ORM) │ │    Servidor de Streaming     │
       │ - Users, Schedule, Requests  │ │   Icecast/Shoutcast Server   │
       │ - Shoutouts, Station Settings│ │    (sv11.hdradios.net:6806)  │
       └──────────────────────────────┘ └──────────────────────────────┘
```

---

## 🚀 Recursos e Funcionalidades

### 1. Player Principal & Modo Música
- **Global Player Bar**: Barra persistente fixada no rodapé que mantém a reprodução de áudio contínua em qualquer página navegada.
- **Modo Música em Tela Cheia**: Interface estilo estúdio com visualização imersiva, disco de vinil giratório com arte do álbum/locutor, VU meter reativo e visualizador de ondas.
- **Equalizador Gráfico de 5 Bandas**: Presets customizados (*Rock, Bass Boost, Vocal, Pop, Eletrônico e Flat*) aplicados em tempo real sem interrupção do streaming.
- **Sleep Timer & Despertador**: Temporizador para desligamento automático e alarme programável para acordar com a rádio sintonizada.

### 2. Grade de Programas Semanal (Schedule)
- Filtro interativo por dias da semana com contadores de atrações.
- Identificação visual instantânea da atração com badge pulsante **"NO AR AGORA"** e indicação de reprises.
- Suporte a programas diários, semanais e blocos especiais automatizados (*REB 24hs*, *inLINE Madrugadão*).

### 3. Hotsites de Locutores & Programas
- Modal completo para cada programa contendo sinopse, perfil do locutor, horários de exibição e reprises.
- **Galeria Multimídia**: Exibição de fotos em alta resolução com lightbox de zoom e players de vídeos embutidos.
- **Gravações & Podcasts**: Integração com Mixcloud para streaming sob demanda de edições anteriores gravadas.
- **Área do Locutor**: Login individual por programa para o locutor atualizar fotos, biografia, redes sociais e playlist sem necessidade de acesso ao painel master.

### 4. Pedidos Musicais Inteligentes
- Busca conectada à base musical com autocompletar inteligente.
- Prévia de áudio de até 1:30 minuto para validação da música antes do envio.
- Informações de release da banda/artista geradas automaticamente.
- Envio integrado ao painel do locutor e com link direto para o WhatsApp do estúdio.
- Sistema comunitário de votação para impulsionar faixas mais pedidas.

### 5. Mural de Recados dos Ouvintes
- Envio de mensagens em tempo real com identificação de cidade e ouvinte.
- Autenticação simples via Conta Google (Firebase Auth).
- Sistema de curtidas com persistência local e no banco de dados.
- Moderação de conteúdo para fixação de avisos oficiais e exclusão de mensagens impróprias.

### 6. Painel Administrativo Mestre (Admin)
- Gestão completa da grade semanal (criação, edição, desativação de programas).
- Gerenciador de banners promocionais e patrocinadores com cliques contabilizados.
- Ativação do **Live Takeover** (intervenção extraordinária ao vivo que sobrepõe temporariamente a programação normal).
- Editor do logotipo da rádio com upload customizado.

### 7. Arquitetura de Links & Deep Linking (SPA sem corte de áudio)
- URLs limpas e indexáveis para cada seção da plataforma:
  - `/` ou `/radio`: Rádio Ao Vivo e Player Master.
  - `/programas`: Grade oficial completa dos 25 programas e 18 locutores.
  - `/programas/:slug`: Hotsite dedicado do programa individual.
  - `/mural`: Mural comunitário de recados dos ouvintes.
  - `/pedidos`: Pedir música e votação de faixas em tempo real.
  - `/rebeldia`: Manifesto, história e dados institucionais.
  - `/admin`: Painel de administração.
- Navegação sincronizada via HTML5 History API: links diretos e compartilháveis com reprodução de áudio contínua e sem interrupções.

### 8. Módulo de SEO & GEO (Padrão Yoast Plugin)
- **Painel Administrativo Yoast**: Aba dedicada para edição e auditoria em tempo real de metadados por página (`page_seo`).
- **Simulador do Google Search**: Prévia visual exata do snippet no Google (Mobile e Desktop) com verificação de tamanho ideal de títulos (30–60 caracteres) e descrições (120–160 caracteres).
- **Simulador Social**: Visualização dos cards de compartilhamento para WhatsApp, Facebook, LinkedIn e Twitter/X (`og:title`, `og:description`, `og:image`, `twitter:card`).
- **Indexação Geográfica (GEO Tags)**: Suporte completo a Geotargeting (`geo.region`, `geo.placename`, `geo.position`, `ICBM`) centrado na sede da rádio em Canoas/RS e região metropolitana.
- **Dados Estruturados Schema.org**: JSON-LD integrado (`RadioStation`, `BroadcastService`, `WebPage`).
- **SSR Server Injection**: Injeção dinâmica no `<head>` das páginas servidas pelo `server.ts` para que robôs de busca e redes sociais leiam os metadados corretos diretamente no HTML.

---

## 🎛 Motor de Áudio & DSP (Web Audio API)

A aplicação utiliza a especificação moderna da **Web Audio API** do W3C para processamento de sinal digital diretamente na thread de áudio do cliente:

- **AudioContext**: Criação de nós de áudio conectados ao elemento HTML5 `<audio>`.
- **BiquadFilterNode**: Conjunto de filtros IIR encadeados para processamento de frequências:
  - *Low-Shelf* (60 Hz — Graves)
  - *Peaking* (250 Hz — Médios-Graves)
  - *Peaking* (1000 Hz — Médios)
  - *Peaking* (4000 Hz — Médios-Agudos)
  - *High-Shelf* (12000 Hz — Agudos)
- **AnalyserNode**: Extração contínua de transformada rápida de Fourier (FFT) em 64 bins para alimentar os visualizadores gráficos com suavização de tempo (`smoothingTimeConstant: 0.85`).
- **StereoPannerNode**: Controle de equilíbrio estéreo e espacialização.

---

## 📱 PWA & Suporte Mobile

A aplicação implementa os critérios oficiais de **Progressive Web App**:

- **Manifesto Web (`manifest.json`)**: Ícones adaptativos em múltiplas resoluções, cores de tema (`#09090b`), orientação responsiva e modo `standalone` sem barras de navegação do browser.
- **Service Worker (`sw.js`)**: Cache estratégico de ativos estáticos, fontes, imagens e páginas para carregamento instantâneo.
- **Modal de Instalação Nativo**: Instruções passo a passo customizadas para instalação em dispositivos **Android** (Google Chrome) e **iPhone/iPad** (Safari).
- **Design Mobile-First**: Otimização completa para telas de 320px até desktops ultrawide, respeitando áreas seguras e gestos de toque.

---

## 🗄 Banco de Dados & Esquema (Drizzle ORM)

O banco de dados relacional utiliza tabelas estruturadas via Drizzle ORM:

```typescript
// Tabelas principais mapeadas em src/db/schema.ts
users            // Usuários e ouvintes autenticados via Firebase Auth
schedule         // Grade de programação semanal, reprises e hotsites
song_requests    // Fila de pedidos de músicas com votação e status
shoutouts        // Mural de recados comunitários com contagem de curtidas
station_settings // Chaves de configuração global da rádio e Live Takeover
```

---

## 🔌 APIs & Rotas do Servidor

O servidor Express (`server.ts`) expõe as seguintes rotas de API REST:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/stream` | Proxy do streaming de áudio para evitar bloqueios de CORS e Mixed Content HTTP/HTTPS. |
| `GET` | `/api/metadata` | Consulta em tempo real do título da música e artista no ar via ICY metadata. |
| `GET` | `/api/music/search?q=:query` | Busca de faixas musicais com prévia de áudio e capa de álbum. |
| `GET` | `/api/schedule` | Lista completa da grade de programação e atrações ativas. |
| `POST` | `/api/schedule` | Criação/atualização de programa na grade (Requer Auth Admin/Locutor). |
| `GET` | `/api/requests` | Listagem dos pedidos musicais recentes dos ouvintes. |
| `POST` | `/api/requests` | Registro de novo pedido de música. |
| `POST` | `/api/requests/:id/vote`| Voto positivo em um pedido musical existente. |
| `GET` | `/api/shoutouts` | Leitura das mensagens aprovadas do mural de recados. |
| `POST` | `/api/shoutouts` | Publicação de novo recado no mural. |
| `POST` | `/api/shoutouts/:id/like`| Incremento de curtida em um recado. |
| `GET` | `/api/settings` | Leitura das configurações globais da rádio e status de Live Takeover. |
| `POST` | `/api/settings` | Atualização das configurações da emissora (Requer Auth Admin). |
| `POST` | `/api/hosts/login` | Autenticação por senha do locutor responsável pelo programa. |

---

## 📁 Estrutura de Pastas e Arquivos

```text
├── public/                       # Ativos públicos (manifest, ícones, logos, mascotes)
│   ├── header-box-bg.jpg         # Imagem temática de estúdio analógico
│   ├── logo.svg                  # Vetor oficial da marca Rebeldia FM
│   ├── manifest.json             # Manifesto PWA para instalação mobile
│   └── sw.js                     # Service Worker para cache offline
├── src/
│   ├── assets/                   # Recursos e imagens internas
│   ├── components/               # Componentes reutilizáveis da interface
│   │   ├── AdminManagerModal.tsx # Painel de controle e administração geral
│   │   ├── GlobalPlayerBar.tsx   # Barra persistente de áudio no rodapé
│   │   ├── InstitutionalView.tsx # Página de história, manifesto e contatos
│   │   ├── MusicModeModal.tsx    # Modo música em tela cheia com vinil e VU
│   │   ├── MuralBoard.tsx        # Mural social de recados dos ouvintes
│   │   ├── ProgramHotsiteModal.tsx# Hotsite e biografia de cada atração
│   │   ├── ScheduleView.tsx      # Grade semanal com filtro por dias
│   │   ├── SettingsModal.tsx     # Equalizador e ajustes de áudio
│   │   ├── SongRequestsModal.tsx # Central de pedidos musicais
│   │   └── TodayScheduleSection.tsx # Grade de hoje na página inicial
│   ├── data/                     # Dados pré-configurados e programações oficiais
│   │   ├── initialData.ts        # Dados padrão de inicialização e fallback
│   │   ├── institutional.ts      # Textos e manifesto histórico da emissora
│   │   └── officialData.ts       # Grade oficial completa e contas de locutores
│   ├── db/                       # Camada de banco de dados
│   │   ├── index.ts              # Conexão Drizzle com o driver PostgreSQL
│   │   ├── schema.ts             # Esquema relacional das tabelas
│   │   └── users.ts              # Helpers de usuários e papéis
│   ├── middleware/               # Middlewares de autenticação Express
│   ├── utils/                    # Utilitários de formatação, áudio e API
│   │   ├── api.ts                # Cliente HTTP frontend para consumo das rotas
│   │   ├── audioDsp.ts           # Configuração de nós do equalizador Web Audio
│   │   └── scheduleFormatter.ts  # Formatador de horários e dias da semana
│   ├── App.tsx                   # Componente raiz e orquestrador do estado
│   ├── index.css                 # Importação do Tailwind CSS v4 e temas
│   ├── main.tsx                  # Ponto de entrada do React 19
│   └── types.ts                  # Tipagens TypeScript completas do ecossistema
├── index.html                    # Ponto de entrada HTML com meta tags SEO/OpenGraph
├── package.json                  # Scripts e dependências NPM
├── server.ts                     # Servidor Express Full-Stack e APIs
├── tsconfig.json                 # Configurações do TypeScript
└── vite.config.ts                # Configuração do Vite e plugins
```

---

## 💻 Instalação e Execução Local

### Pré-requisitos
- **Node.js** versão 20 ou superior.
- Gerenciador de pacotes **npm** ou **bun**.
- Instância ativa do **PostgreSQL** (ou uso de Cloud SQL).

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/rebeldia-fm.git
   cd rebeldia-fm
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Preencha as chaves no arquivo .env conforme necessário
   ```

4. **Inicie o ambiente de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará acessível em `http://localhost:3000`.

5. **Compilação para Produção:**
   ```bash
   npm run build
   npm start
   ```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Porta do servidor
PORT=3000

# Conexão com o banco de dados PostgreSQL
DATABASE_URL=postgres://usuario:senha@localhost:5432/rebeldiafm

# URL oficial do streaming de áudio da emissora
VITE_STREAM_URL=https://sv11.hdradios.net:6806

# Configurações do Firebase (Opcional para Login Google)
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# Google Gemini API Key (Opcional para recursos de IA)
GEMINI_API_KEY=sua_gemini_api_key
```

---

## 📜 Scripts do Projeto

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor full-stack de desenvolvimento via `tsx server.ts`. |
| `npm run build` | Compila o bundle frontend via Vite e o backend em CJS via esbuild. |
| `npm run start` | Executa o servidor de produção empacotado (`node dist/server.cjs`). |
| `npm run lint` | Valida todos os arquivos do projeto com verificação estrita do compilador TypeScript (`tsc --noEmit`). |
| `npm run clean` | Remove as pastas de build temporárias (`dist/`). |

---

## 📄 Licença

Este projeto é desenvolvido para a **Rebeldia FM** e seus ouvintes.
Todos os direitos reservados à **Rebeldia FM — radio LIVRE**.
