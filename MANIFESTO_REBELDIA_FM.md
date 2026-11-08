# MANIFESTO DE MARCA, IDENTIDADE VISUAL & GUIA DE ESTILO
# REBELDIA FM (RFM)
> **"Rádio Livre • O Som que Incomoda o Sistema"**  
> *Versão Oficial 1.0 — Guia de Identidade, Cores, Tipografia e Tokens CSS*

---

## 1. ESSÊNCIA DA MARCA & TOM DE VOZ

### 1.1. Missão & Posicionamento
A **Rebeldia FM** é uma emissora digital e multiplataforma de rádio livre nascida para resgatar a autenticidade musical e devolver a voz a quem faz e consome cultura independente. Rejeitamos algoritmos pasteurizados, programações engessadas e o pagamento de jabá. 

### 1.2. Os 4 Pilares da Marca
1. **Liberdade Sem Jabá (Autonomia)**: A curadoria musical é 100% artística. Nenhuma gravadora compra espaço na nossa programação.
2. **Cena Independente (Cultura Viva)**: Palco aberto e prioritário para bandas autorais, novos talentos do rock e movimentos contraculturais.
3. **Comunidade & Conexão Real (Voz do Ouvinte)**: O ouvinte participa diretamente via Mural de Recados, pedidos de música em tempo real e hotsites dedicados aos locutores.
4. **Alta Fidelidade & Tecnologia (DSP Digital)**: Áudio cristalino em 128 kbps AAC/MP3, processamento Web Audio DSP com equalizador gráfico de 5 bandas e suporte PWA offline.

### 1.3. Tom de Voz
- **Personalidade**: Firme, enérgico, contestador, autêntico e apaixonado por música.
- **Linguagem**: Direta, sem jargões corporativos ou clichês comerciais de rádio tradicional. Fala de igual para igual com o ouvinte.
- **O que Evitar**: Fala excessivamente formal, promessas vazias, termos publicitários desgastados ("a número 1", "o melhor do Brasil") ou tom robótico.

---

## 2. PALETA DE CORES OFICIAL

A identidade visual principal da Rebeldia FM é baseada em uma atmosfera noturna de estúdio analógico combinada com a eletricidade do rock clássico.

### 2.1. Paleta Principal (Identidade Rock Rebeldia - Dark Default)

| Cor | Nome do Tom | Hexadecimal | RGB | Função no Design |
| :--- | :--- | :--- | :--- | :--- |
| ![#F59E0B](https://via.placeholder.com/15/F59E0B/000000?text=+) | **Âmbar Dourado Rock** | `#F59E0B` | `rgb(245, 158, 11)` | **Cor Primária**: Botões principais, indicadores ativos, destaque de logos |
| ![#D97706](https://via.placeholder.com/15/D97706/000000?text=+) | **Âmbar Escuro Hover** | `#D97706` | `rgb(217, 119, 6)` | Estados hover de botões primários |
| ![#EF4444](https://via.placeholder.com/15/EF4444/000000?text=+) | **Vermelho Rock (No Ar)** | `#EF4444` | `rgb(239, 68, 68)` | **Cor Secundária**: Badge "NO AR", transmissões ao vivo, alertas |
| ![#F97316](https://via.placeholder.com/15/F97316/000000?text=+) | **Laranja Solar Acento** | `#F97316` | `rgb(249, 115, 22)` | Detalhes de interação, gradientes e acentos de destaque |
| ![#09090B](https://via.placeholder.com/15/09090B/000000?text=+) | **Obsidian Profundo** | `#09090B` | `rgb(9, 9, 11)` | **Fundo Base**: Canvas global da aplicação |
| ![#121216](https://via.placeholder.com/15/121216/000000?text=+) | **Cinza Estúdio Escuro** | `#121216` | `rgb(18, 18, 22)` | Superfícies, cards de programas e modais |
| ![#F4F4F5](https://via.placeholder.com/15/F4F4F5/000000?text=+) | **Branco Titânio** | `#F4F4F5` | `rgb(244, 244, 245)` | Tipografia principal de alto contraste |
| ![#A1A1AA](https://via.placeholder.com/15/A1A1AA/000000?text=+) | **Zinc Muted** | `#A1A1AA` | `rgb(161, 161, 170)` | Subtítulos, metadados secundários e rótulos |

---

### 2.2. Paletas Alternativas da Rádio (Configuráveis no Tema)

1. **Cyber Violet & Forest** (Noturno Refinado):
   - Roxo Violeta: `#6B256F` | Ameixa Escura: `#35122E` | Azul Céu: `#93B4DB` | Verde Pistache: `#D0E4AE` | Verde Floresta: `#194B32`
2. **Sunset Vintage & Terracotta** (Vintage Rock):
   - Verde Oliva: `#636500` | Ocre Dourado: `#B29B27` | Amarelo Ouro: `#FFB400` | Laranja Coral: `#FF6333` | Terracota: `#BE1E1C`
3. **Pop CMYK Studio** (Moderno & Contrastante):
   - Amarelo Pop: `#FFB800` | Magenta Neon: `#E62B6E` | Azul Real: `#1C75BC` | Verde Esmeralda: `#268E6C`
4. **Rock Rebeldia Clean (Light Mode)**:
   - Fundo: `#F8FAFC` | Borda: `#E2E8F0` | Âmbar Dourado: `#D97706` | Vermelho Carmim: `#DC2626` | Texto: `#0F172A`

---

## 3. TIPOGRAFIA & HIERARQUIA

A tipografia deve transparecer modernidade, precisão suíça e robustez:

- **Fonte Primária (Display / Títulos / Logomarca)**:
  `'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - *Pesos*: `700 (Bold)` e `800 (ExtraBold)`
  - *Letter-spacing*: `-0.025em` a `-0.03em` (tracking compacto para visual marcante)
- **Fonte de Conteúdo (Body / Textos)**:
  `'Inter', -apple-system, sans-serif`
  - *Tamanho Base*: `18px` (`html { font-size: 18px; }`) para legibilidade e acessibilidade
  - *Line-height*: `1.5` a `1.6`
  - *Cores*: `#F4F4F5` (Texto principal) e `#A1A1AA` (Texto secundário)
- **Fonte Técnica & Numérica (Equalizador / Metadados / DSP / Frequências)**:
  `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`
  - *Aplicação*: Frequências em Hz, taxas de amostragem em kbps, relógios e timers.

---

## 4. LOGOTIPO & ELEMENTOS VISUAIS

- **Composição da Marca**:
  1. **Tipografia de Impacto**: "REBELDIA" em maiúsculas com caixa alta sólida e proporção geométrica, acompanhado da chancela "FM" ou "RÁDIO LIVRE".
  2. **Mascote RFM**: O mascote rebelde da rádio (armazenado em `/public/mascote-rfm.jpg` e `/public/reb_mascot.jpg`) representa a atitude irreverente e o espírito libertário da estação.
  3. **Ícone de Sinal / Equalizador**: Três barras verticais oscilantes ou ondas sonoras circulares representando a transmissão ao vivo contínua.
- **Área de Respiro**: O logotipo deve manter um respiro mínimo correspondente à altura da letra "R" em relação a outros elementos da tela.
- **Acessibilidade de Contraste**: Em fundos escuros, o logotipo deve ser sempre aplicado em Branco Puro ou Âmbar `#F59E0B`. Em fundos claros, aplicar em Preto Sólido `#09090B` com detalhes em Âmbar `#D97706`.

---

## 5. TOKENS CSS OFICIAIS (COPIE E COLE EM SEU CSS)

Aqui estão os tokens CSS padronizados prontos para integração no `:root`:

```css
:root {
  /* Cores de Destaque da Marca */
  --color-primary: #F59E0B;
  --color-primary-rgb: 245, 158, 11;
  --color-primary-hover: #D97706;
  --color-secondary: #EF4444;
  --color-secondary-rgb: 239, 68, 68;
  --color-accent: #F97316;
  --color-accent-rgb: 249, 115, 22;

  /* Superfícies & Fundos (Dark Mode Oficial) */
  --color-bg-base: #09090B;
  --color-bg-surface: rgba(18, 18, 22, 0.85);
  --color-bg-surface-hover: rgba(28, 28, 34, 0.95);
  --color-bg-card: #121216;

  /* Bordas e Divisores */
  --color-border: rgba(255, 255, 255, 0.12);
  --color-border-active: rgba(245, 158, 11, 0.6);

  /* Tipografia */
  --color-text-main: #F4F4F5;
  --color-text-muted: #A1A1AA;

  /* Badges e Brilhos */
  --color-badge-bg: rgba(245, 158, 11, 0.15);
  --color-badge-text: #FCD34D;
  --color-glow: rgba(245, 158, 11, 0.35);
  --theme-highlight: #F59E0B;
  --theme-highlight-text: #000000;

  /* Raios de Arredondamento */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 9999px;
}
```

---

## 6. CONTATOS E REGISTRO DA EMISSORA

- **Nome Fantasia**: REBELDIA FM
- **Slogan**: Rádio Livre • O Som que Incomoda o Sistema
- **Localização**: Canoas - RS, Brasil • Transmissão Global Web & App
- **E-mail Oficial**: `radio@rebeldiafm.com.br`
- **WhatsApp do Ouvinte**: `+55 (48) 99198-4678`
- **Instagram**: `@rebeldiafm`
- **Streaming Master**: Áudio 128 kbps AAC/MP3 Stereo de baixa latência
