import { ProgramItem, RadioStationConfig, SongRequest, ShoutoutMessage, PromoBanner, HostAccount } from '../types';
import { OFFICIAL_HOSTS } from './officialData';

export const DEFAULT_REB_PROGRAM: ProgramItem = {
  id: 'reb-default-auto',
  dayOfWeek: -1,
  startTime: '00:00',
  endTime: '23:59',
  title: 'REB - 24hs NOAR',
  host: 'REB',
  hostRole: 'Locutor Virtual Oficial 24h',
  description: 'A voz oficial da Rebeldia FM! REB comanda a programação com atitude rock and roll, jaqueta de couro e microfone afinado, tocando a melhor seleção de rock, indie, MPB, reggae e novidades sem censura 24 horas por dia.',
  genre: 'Rock, Indie & Alternativo',
  badge: 'Locutor Oficial REB',
  avatarUrl: '/reb_mascot.jpg',
  logoUrl: '/reb_mascot.jpg',
  bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
  whatsappNumber: '5548991984678',
  daysLabel: '24h • Horário Livre & Transmissão Contínua',
  hostBio: 'REB é a voz lendária e locutor oficial da Rebeldia FM. Com seu microfone vintage cromado, jaqueta de couro rebelde e bandana vermelha, ele mantém o som na pressão máxima nos intervalos da grade e recebe seus pedidos pelo WhatsApp geral da rádio!',
  isRebDefault: true,
  hasReprise: false,
  hostAccountId: 'host-reb',
  hostPassword: 'senha123',
  photoGallery: [
    '/reb_mascot.jpg',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
  ],
};

export const DEFAULT_RADIO_CONFIG: RadioStationConfig = {
  name: 'Rebeldia FM',
  slogan: 'radio LIVRE',
  streamUrl: 'https://sv11.hdradios.net:6806/;',
  alternativeStreams: [
    { label: 'Stream Oficial Rebeldia FM (;)', url: 'https://sv11.hdradios.net:6806/;' },
    { label: 'Stream Mount Live (/stream)', url: 'https://sv11.hdradios.net:6806/stream' },
    { label: 'Stream AAC / Live', url: 'https://sv11.hdradios.net:6806/live' },
    { label: 'Stream MP3 HD (;stream.mp3)', url: 'https://sv11.hdradios.net:6806/;stream.mp3' },
  ],
  whatsappNumber: '5548991984678',
  instagramHandle: '@rebeldiafm',
  facebookUrl: 'https://facebook.com/rebeldiafm',
  websiteUrl: 'https://rebeldiafm.com.br',
  email: 'radio@rebeldiafm.com.br',
  location: 'Canoas - RS, Brasil • Transmissão Global Web',
  bitrate: '128 kbps HD',
  codec: 'MP3 / AAC+ Stereo',
  logoUrl: '/reb_mascot.jpg',
  metadataDelaySeconds: 10,
};

export const INITIAL_PROGRAMS: ProgramItem[] = [
  {
    "id": "prog-contracultura",
    "dayOfWeek": 1,
    "startTime": "20:00",
    "endTime": "21:00",
    "title": "Contracultura",
    "host": "Tais Castro",
    "hostRole": "Jornalista e Radialista",
    "hostAccountId": "host-tais-castro",
    "daysLabel": "Segunda-feira às 20:00",
    "genre": "Cultura, Literatura, Cinema & Entrevistas",
    "description": "Programa de cultura, agenda de eventos, entrevistas e debates sobre literatura e cinema independente, sob o comando da jornalista Tais Castro.",
    "hostBio": "Jornalista e radialista com ótimo conhecimento e experiência em televisão, atuando como apresentadora, produtora, repórter e editora de programas. Foi âncora do programa Radar veiculado pela TVE/RS.",
    "hasReprise": true,
    "repriseDayOfWeek": 3,
    "repriseStartTime": "11:00",
    "repriseEndTime": "12:00",
    "repriseDaysLabel": "Quarta-feira às 11:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/a/c/c/3/9a3c-0f7e-4eac-9f86-8305c5b52659",
    "bannerUrl": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/a/c/c/3/9a3c-0f7e-4eac-9f86-8305c5b52659",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Agenda Cultural",
        "description": "O que há de mais relevante no circuito artístico independente."
      },
      {
        "title": "Entrevistas de Estúdio",
        "description": "Diálogos aprofundados com pensadores, escritores e artistas."
      },
      {
        "title": "Literatura & Cinema",
        "description": "Resenhas de obras fundamentais e lançamentos da telona."
      }
    ],
    "mixcloudUser": "contracultura",
    "mixcloudUrl": "https://www.mixcloud.com/contracultura/"
  },
  {
    "id": "prog-celebra",
    "dayOfWeek": 1,
    "startTime": "21:00",
    "endTime": "22:00",
    "title": "Celebra",
    "host": "Janine Mello",
    "hostRole": "Apresentadora & Comunicadora Zen",
    "hostAccountId": "host-janine-mello",
    "daysLabel": "Segunda-feira às 21:00",
    "genre": "Filosofia Zen, Saúde Holística & Música Oriental",
    "description": "Programa focado na filosofia zen, estilo de vida consciente, medicina alternativa e alimentação saudável. Entrevistas com moradores de comunidades alternativas e terapeutas.",
    "hostBio": "Profissional da comunicação, apresenta um programa focado na filosofia zen, com matérias sobre estilo de vida, medicina alternativa e alimentação consciente. Traz entrevistas com pessoas de comunidades alternativas e especialistas.",
    "hasReprise": true,
    "repriseDayOfWeek": 3,
    "repriseStartTime": "10:00",
    "repriseEndTime": "11:00",
    "repriseDaysLabel": "Quarta-feira às 10:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/8/9/7/5/a84b-5ca8-44d4-855a-263df5bb3769",
    "bannerUrl": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/8/9/7/5/a84b-5ca8-44d4-855a-263df5bb3769",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Ecologia & Sustentabilidade",
        "description": "Práticas de vida integradas à preservação e equilíbrio planetário."
      },
      {
        "title": "Saúde do Corpo e Mente",
        "description": "Dicas de medicina integrativa, alimentação viva e terapias naturais."
      },
      {
        "title": "Mantras & Música Oriental",
        "description": "Playlist temática com frequências elevadas e instrumentos sagrados."
      },
      {
        "title": "Cursos & Festivais",
        "description": "Divulgação de retiros e encontros de comunidades alternativas."
      }
    ],
    "mixcloudUser": "celebra",
    "mixcloudUrl": "https://www.mixcloud.com/celebra/"
  },
  {
    "id": "prog-sexoconexo",
    "dayOfWeek": 1,
    "startTime": "22:00",
    "endTime": "23:00",
    "title": "SexoConexo",
    "host": "Fabi Midori",
    "hostRole": "Jornalista e Radialista",
    "hostAccountId": "host-fabi-midori",
    "daysLabel": "Segunda-feira às 22:00",
    "genre": "Comportamento, Sexualidade & Bem-estar",
    "description": "Aborda comportamento, relacionamento, intimidade e bem-estar com uma linguagem direta, empática e descomplicada, livre de tabus.",
    "hostBio": "Jornalista e radialista com sólida experiência em rádio e TV. O programa aborda comportamento, sexualidade, relacionamentos e bem-estar com uma linguagem direta, empática e sem tabus.",
    "hasReprise": true,
    "repriseDayOfWeek": 0,
    "repriseStartTime": "21:00",
    "repriseEndTime": "22:00",
    "repriseDaysLabel": "Domingo às 21:00",
    "avatarUrl": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80",
    "bannerUrl": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Relacionamentos Contemporâneos",
        "description": "Amor livre, monogamia, novas configurações afetivas e diálogo."
      },
      {
        "title": "Saúde Íntima & Bem-estar",
        "description": "Informação qualificada com especialistas, médicos e psicólogos."
      },
      {
        "title": "Consultório Sem Censura",
        "description": "Perguntas anônimas dos ouvintes respondidas com naturalidade e leveza."
      }
    ]
  },
  {
    "id": "prog-final-dream-jazz",
    "dayOfWeek": 1,
    "startTime": "23:00",
    "endTime": "00:00",
    "title": "Final Dream Jazz",
    "host": "Ricardo Dornelles Worf",
    "hostRole": "Apresentador e Pesquisador de Jazz",
    "hostAccountId": "host-ricardo-worf",
    "daysLabel": "Segunda-feira às 23:00",
    "genre": "Jazz Clássico, Contemporâneo & Instrumental",
    "description": "O melhor do jazz de todos os tempos, passando por grandes mestres, vertentes contemporâneas, fusões e releituras sofisticadas.",
    "hostBio": "Pesquisador e comunicador apaixonado pelo universo do jazz, dedicando-se à preservação e difusão das matrizes sonoras do gênero.",
    "hasReprise": true,
    "repriseDayOfWeek": 0,
    "repriseStartTime": "10:00",
    "repriseEndTime": "11:00",
    "repriseDaysLabel": "Domingo às 10:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/2/6/8/3/86e1-1571-4c9c-9aa3-88aeafaaad07",
    "bannerUrl": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/2/6/8/3/86e1-1571-4c9c-9aa3-88aeafaaad07",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Clássicos Imortais",
        "description": "Miles Davis, John Coltrane, Thelonious Monk, Bill Evans e lendas do bebop."
      },
      {
        "title": "Novos Lançamentos",
        "description": "O que há de mais inventivo no jazz contemporâneo instrumental mundial."
      },
      {
        "title": "Curiosidades dos Mestres",
        "description": "Bastidores de sessões históricas gravadas nos estúdios da Blue Note e Impulse!."
      }
    ],
    "mixcloudUser": "finaldreamjazz",
    "mixcloudUrl": "https://www.mixcloud.com/finaldreamjazz/"
  },
  {
    "id": "prog-avox-terca",
    "dayOfWeek": 2,
    "startTime": "19:00",
    "endTime": "20:00",
    "title": "Avox do Brasil",
    "host": "Marcelo Krauthein e Pedro Teixeira",
    "hostRole": "Apresentadores e Debatedores",
    "hostAccountId": "host-avox-brasil",
    "daysLabel": "Terça-feira às 19:00",
    "genre": "Debates, Política, Educação & Cultura",
    "description": "Roda de conversa sobre atualidades, ensino, democracia e direitos. Comandada pelo professor Pedro e Marcelo Krauthein, com Teresinha Cardoso, Jefferson Pecori e Pedro Pereira.",
    "hostBio": "Marcelo Krauthein e Pedro Teixeira reúnem acadêmicos e comunicadores para debater os principais temas da conjuntura política e social do país.",
    "hasReprise": true,
    "repriseDayOfWeek": 0,
    "repriseStartTime": "16:00",
    "repriseEndTime": "17:00",
    "repriseDaysLabel": "Domingo às 16:00",
    "avatarUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    "bannerUrl": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/1/f/4/3/97e4-9e7a-4868-aa44-a7b5b1e3d2e4",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Educação Pública em Pauta",
        "description": "Análises de políticas educacionais com a Profa. Teresinha Cardoso."
      },
      {
        "title": "Conjuntura Nacional",
        "description": "Debate aprofundado com Jefferson Pecori e Pedro Pereira sobre os rumos do país."
      },
      {
        "title": "Vozes da Comunidade",
        "description": "Espaço aberto para professores, alunos e lideranças populares."
      }
    ],
    "mixcloudUser": "Avoxdobrasil",
    "mixcloudUrl": "https://www.mixcloud.com/Avoxdobrasil/"
  },
  {
    "id": "prog-no-passo-de-floripa",
    "dayOfWeek": 2,
    "startTime": "20:00",
    "endTime": "22:00",
    "title": "No Passo de Floripa",
    "host": "Rodrigo Abromovicz, Jaqueline Araujo e Guinha Ramires",
    "hostRole": "Apresentadores & Produtores Culturais",
    "hostAccountId": "host-passo-floripa",
    "daysLabel": "Terça-feira às 20:00",
    "genre": "Cultura Catarinense, MPB, Ilha & Turismo",
    "description": "Programa de variedades, cultura, turismo e música da Ilha de Santa Catarina, apresentado por Rodrigo Abromovicz, Jaqueline Araujo e Guinha Ramires.",
    "hostBio": "Rodrigo Abromovicz, Jaqueline Araujo e Guinha Ramires, com produção de Juliene Doria Nunes, trazem a música, os eventos e as histórias da Ilha da Magia.",
    "hasReprise": true,
    "repriseDayOfWeek": 4,
    "repriseStartTime": "10:00",
    "repriseEndTime": "12:00",
    "repriseDaysLabel": "Quinta-feira às 10:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/4/9/d/c/fe40-187c-4a02-82b4-09bd54ebbf52",
    "bannerUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/4/9/d/c/fe40-187c-4a02-82b4-09bd54ebbf52",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Artistas da Ilha",
        "description": "Entrevistas exclusivas e pocket shows com nomes proeminentes da música catarinense."
      },
      {
        "title": "Agenda Cultural de Floripa",
        "description": "Guia completo de exposições, teatro de rua e shows pela cidade."
      },
      {
        "title": "Violão Mágico de Guinha",
        "description": "Performances e comentários do consagrado músico e compositor Guinha Ramires."
      }
    ],
    "mixcloudUser": "nopassodefloripa",
    "mixcloudUrl": "https://www.mixcloud.com/nopassodefloripa/"
  },
  {
    "id": "prog-punk-and-rockers",
    "dayOfWeek": 2,
    "startTime": "22:00",
    "endTime": "23:00",
    "title": "Punk and Rockers",
    "host": "Ronaldo Oliveira",
    "hostRole": "Locutor & Produtor Rock",
    "hostAccountId": "host-ronaldo-oliveira",
    "daysLabel": "Terça-feira às 22:00",
    "genre": "Punk Rock, Hardcore, Crossover & Atitude",
    "description": "A força do punk rock clássico e contemporâneo, novidades do cenário independente e muita energia sem meias-palavras sob o comando de Ronaldo Oliveira.",
    "hostBio": "Comunicador com longa trajetória no punk rock e circuitos alternativos, compartilhando lançamentos independentes e bastidores da cena roqueira.",
    "hasReprise": true,
    "repriseDayOfWeek": 5,
    "repriseStartTime": "11:00",
    "repriseEndTime": "12:00",
    "repriseDaysLabel": "Sexta-feira às 11:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/2/8/9/b/507a-85fe-448e-9a35-6798630d4925",
    "bannerUrl": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/2/8/9/b/507a-85fe-448e-9a35-6798630d4925",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Old School 77",
        "description": "The Clash, Sex Pistols, Ramones, Buzzcocks e os pioneiros da rebeldia sonora."
      },
      {
        "title": "Cena Hardcore Nacional",
        "description": "Ratos de Porão, Cólera, Garotos Podres e novas bandas que mantêm a chama acesa."
      },
      {
        "title": "Lançamentos Mundiais",
        "description": "Novidades quentes das gravadoras independentes internacionais."
      }
    ],
    "mixcloudUser": "punkandrockers",
    "mixcloudUrl": "https://www.mixcloud.com/punkandrockers/"
  },
  {
    "id": "prog-acordes-eletricos",
    "dayOfWeek": 2,
    "startTime": "23:00",
    "endTime": "00:00",
    "title": "Acordes Elétricos",
    "host": "Rodrigo Vizzotto",
    "hostRole": "Músico e Jornalista",
    "hostAccountId": "host-rodrigo-vizzotto",
    "daysLabel": "Terça-feira às 23:00",
    "genre": "Rock Gaúcho, Indie Rock, Pop Rock & Underground",
    "description": "O som das guitarras, novidades do rock gaúcho e nacional, lançamentos independentes e resenhas exclusivas conduzidas pelo músico Rodrigo Vizzotto.",
    "hostBio": "Músico e jornalista, criador do podcast Acordes Elétricos veiculado desde abril de 2020, com foco na cena pop/rock, guitarras e novidades do underground.",
    "hasReprise": true,
    "repriseDayOfWeek": 5,
    "repriseStartTime": "10:00",
    "repriseEndTime": "11:00",
    "repriseDaysLabel": "Sexta-feira às 10:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/7/e/2/9/4d0b-1327-46a0-8801-dd65b9bd40a0",
    "bannerUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/7/e/2/9/4d0b-1327-46a0-8801-dd65b9bd40a0",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Giro pelo Rock Gaúcho",
        "description": "A força da produção do Sul com bandas autorais e festivais do estado."
      },
      {
        "title": "Solo de Guitarra",
        "description": "Destaque para instrumentistas e arranjos virtuosos do rock mundial."
      },
      {
        "title": "Papo com Compositores",
        "description": "Entrevistas sobre processos criativos e produção musical independente."
      }
    ],
    "mixcloudUser": "eletroacordes",
    "mixcloudUrl": "https://www.mixcloud.com/eletroacordes/"
  },
  {
    "id": "prog-discodecada",
    "dayOfWeek": 3,
    "startTime": "20:00",
    "endTime": "21:00",
    "title": "DiscoDécada",
    "host": "Renato Sperb",
    "hostRole": "Apresentador e Pesquisador Musical",
    "hostAccountId": "host-renato-sperb",
    "daysLabel": "Quarta-feira às 20:00",
    "genre": "Disco Music, Funk Clássico, Soul 70s & 80s",
    "description": "Uma viagem dançante pelas décadas de ouro da Disco Music, Soul, Funk e os maiores sucessos que embalaram as pistas do mundo.",
    "hostBio": "Grande pesquisador musical da Rebeldia FM, comanda projetos que vão das pistas de dança (DiscoDécada) à música raiz norte-americana (American Country Radio Show) e ao som de estrada (Soncro).",
    "hasReprise": true,
    "repriseDayOfWeek": 6,
    "repriseStartTime": "17:00",
    "repriseEndTime": "18:00",
    "repriseDaysLabel": "Sábado às 17:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/b/6/5/2/1bf2-5db7-4119-9736-ad4cc8060c1f",
    "bannerUrl": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/b/6/5/2/1bf2-5db7-4119-9736-ad4cc8060c1f",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Febre do Studio 54",
        "description": "Donna Summer, Chic, Bee Gees, Earth Wind & Fire e os reis da pista."
      },
      {
        "title": "Rare Grooves",
        "description": "Discos obscuros de funk e soul garimpados em feiras de vinil pelo Brasil."
      },
      {
        "title": "Versões Extended de 12 Polegadas",
        "description": "Mixagens raras para pistas com linhas marcantes de baixo e sopros."
      }
    ],
    "mixcloudUser": "discodecada",
    "mixcloudUrl": "https://www.mixcloud.com/discodecada/"
  },
  {
    "id": "prog-skateabout",
    "dayOfWeek": 3,
    "startTime": "21:00",
    "endTime": "22:00",
    "title": "Skate About (skateABOUT)",
    "host": "Alê Braga",
    "hostRole": "Apresentador e Produtor do Skate About",
    "hostAccountId": "host-ale-braga",
    "daysLabel": "Quarta-feira às 21:00",
    "genre": "Skate Punk, Hardcore, Crossover & Urban Lifestyle",
    "description": "Alê Braga comanda o programa skateABOUT na Rebeldia FM: a trilha sonora perfeita das pistas, bowls e ruas com skate punk, hardcore e novidades da cena do skate.",
    "hostBio": "Alê Braga comanda o programa skateABOUT na Rebeldia FM, com o melhor do skate punk, hardcore, lifestyle urbano e cultura do skateboard.",
    "hasReprise": true,
    "repriseDayOfWeek": 6,
    "repriseStartTime": "16:00",
    "repriseEndTime": "17:00",
    "repriseDaysLabel": "Sábado às 16:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/300x300/profile/d/5/3/4/5f47-fb60-4e18-9e30-15d2cb385b74",
    "bannerUrl": "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/300x300/profile/d/5/3/4/5f47-fb60-4e18-9e30-15d2cb385b74",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Trilha Sonora dos Bowls",
        "description": "Pennywise, Bad Religion, Suicidal Tendencies, Millencolin e sons rápidos."
      },
      {
        "title": "Cultura do Skateboard",
        "description": "Campeonatos, novos picos de rua, marcas independentes e vídeos clássicos."
      },
      {
        "title": "Entrevistas de Pista",
        "description": "Conversas com skatistas amadores e profissionais sobre esporte e música."
      }
    ],
    "mixcloudUser": "skateabout",
    "mixcloudUrl": "https://www.mixcloud.com/skateabout/"
  },
  {
    "id": "prog-dasantigas",
    "dayOfWeek": 3,
    "startTime": "23:00",
    "endTime": "00:00",
    "title": "DasAntigas",
    "host": "Andreis Feldmann",
    "hostRole": "Apresentador e Produtor RFM",
    "hostAccountId": "host-andreis-feldmann",
    "daysLabel": "Quarta-feira às 23:00",
    "genre": "Flashback, Rock Clássico, New Wave & Pop 80s/90s",
    "description": "Músicas que marcaram época nas rádios e nas fitas cassete. Os grandes hits do pop, rock e baladas inesquecíveis apresentadas por Andreis Feldmann.",
    "hostBio": "DJ e comunicador versátil da RFM, responsável pela curadoria nostálgica de DasAntigas, lançamentos independentes no Drops RFM e a energia jamaicana no Reggae Rebeldia.",
    "hasReprise": true,
    "repriseDayOfWeek": 6,
    "repriseStartTime": "15:00",
    "repriseEndTime": "16:00",
    "repriseDaysLabel": "Sábado às 15:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/f/e/5/6/2604-01a6-4eb1-9dfa-cad058727e1f",
    "bannerUrl": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/f/e/5/6/2604-01a6-4eb1-9dfa-cad058727e1f",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Flashback dos Anos 80 e 90",
        "description": "A-ha, Tears for Fears, Duran Duran, Depeche Mode, Simple Minds e hinos pop."
      },
      {
        "title": "Baladas Inesquecíveis",
        "description": "Canções românticas que marcaram gerações de ouvintes de FM."
      },
      {
        "title": "Pedidos Nostalgia",
        "description": "Bloco especial dedicado a memórias afetivas enviadas no WhatsApp da rádio."
      }
    ],
    "mixcloudUser": "dasantigas",
    "mixcloudUrl": "https://www.mixcloud.com/dasantigas/"
  },
  {
    "id": "prog-trilhas-rebeldia",
    "dayOfWeek": 4,
    "startTime": "21:00",
    "endTime": "22:00",
    "title": "Trilhas Rebeldia",
    "host": "Ricardo Fann de Araujo Vianna",
    "hostRole": "Produtor e Apresentador Cinematográfico",
    "hostAccountId": "host-ricardo-fann",
    "daysLabel": "Quinta-feira às 21:00",
    "genre": "Trilhas Sonoras, Cinema & Soundtracks",
    "description": "As grandes trilhas sonoras do cinema mundial, músicas inesquecíveis das telonas e bastidores das composições cinematográficas com Ricardo Fann.",
    "hostBio": "Ricardo Fann de Araujo Vianna, ao lado de Silso Soares, Patricia Chiarel e Luciano Mazin, explora as músicas que ganharam vida eterna no cinema mundial.",
    "hasReprise": true,
    "repriseDayOfWeek": 0,
    "repriseStartTime": "19:00",
    "repriseEndTime": "20:00",
    "repriseDaysLabel": "Domingo às 19:00",
    "avatarUrl": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
    "bannerUrl": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Soundtracks Memoráveis",
        "description": "Ennio Morricone, John Williams, Hans Zimmer, Quentin Tarantino e lendas."
      },
      {
        "title": "Filmes Cult & B-Movies",
        "description": "Trilhas marcantes do cinema independente e produções alternativas dos anos 70 e 80."
      },
      {
        "title": "Bastidores das Telonas",
        "description": "Curiosidades de sincronização sonora, diretores e partituras orquestrais."
      }
    ]
  },
  {
    "id": "prog-hecatombe",
    "dayOfWeek": 4,
    "startTime": "22:00",
    "endTime": "23:00",
    "title": "Hecatombe",
    "host": "Daniel Oliveira",
    "hostRole": "Apresentador e Produtor Heavy Metal",
    "hostAccountId": "host-daniel-oliveira",
    "daysLabel": "Quinta-feira às 22:00",
    "genre": "Heavy Metal, Thrash Metal, Metal Pesado & Underground",
    "description": "O peso sem concessões do heavy metal, thrash metal, clássicos e lançamentos do underground mundial com Daniel Oliveira.",
    "hostBio": "Apresentador e produtor especializado no segmento heavy metal e thrash, trazendo lançamentos independentes e lendas da cena pesada.",
    "hasReprise": true,
    "repriseDayOfWeek": 6,
    "repriseStartTime": "23:00",
    "repriseEndTime": "00:00",
    "repriseDaysLabel": "Sábado às 23:00",
    "avatarUrl": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80",
    "bannerUrl": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Big 4 & Lendas do Thrash",
        "description": "Metallica, Slayer, Megadeth, Anthrax, Sepultura e bandas pioneiras."
      },
      {
        "title": "Underground Pesado",
        "description": "Novidades de bandas autorais de death, black, groove e power metal."
      },
      {
        "title": "Fúria nas Guitarras",
        "description": "Riffs marcantes e bateria em ritmo acelerado para tremer o som."
      }
    ]
  },
  {
    "id": "prog-avox-sexta",
    "dayOfWeek": 5,
    "startTime": "18:00",
    "endTime": "20:00",
    "title": "Avox do Brasil (Edição Musical)",
    "host": "Marcelo Krauthein e Pedro Teixeira",
    "hostRole": "Apresentadores e Debatedores",
    "hostAccountId": "host-avox-brasil",
    "daysLabel": "Sexta-feira às 18:00",
    "genre": "MPB, Bossa Nova, Choro & Música Popular Brasileira",
    "description": "A edição de sexta-feira do Avox do Brasil abre o fim de semana com o melhor da MPB, música instrumental brasileira e participação do mestre Guinha Ramires.",
    "hostBio": "Marcelo Krauthein e Pedro Teixeira, com Profª Teresinha Cardoso, Jefferson Pecori e Pedro Pereira, comandam debates vivos sobre atualidades e educação, além do melhor da música brasileira com Guinha Ramires.",
    "hasReprise": true,
    "repriseDayOfWeek": 0,
    "repriseStartTime": "18:00",
    "repriseEndTime": "19:00",
    "repriseDaysLabel": "Domingo às 18:00",
    "avatarUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    "bannerUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/1/f/4/3/97e4-9e7a-4868-aa44-a7b5b1e3d2e4",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Grandes Mestres da MPB",
        "description": "Chico Buarque, Caetano Veloso, Gilberto Gil, Elis Regina e Milton Nascimento."
      },
      {
        "title": "Instrumental Brasileiro",
        "description": "Choro, violão brasileiro e composições sofisticadas de Guinha Ramires."
      },
      {
        "title": "Abertura do Fim de Semana",
        "description": "Clima descontraído de estúdio para começar a sexta-feira leve e feliz."
      }
    ],
    "mixcloudUser": "Avoxdobrasil",
    "mixcloudUrl": "https://www.mixcloud.com/Avoxdobrasil/"
  },
  {
    "id": "prog-drops-rfm",
    "dayOfWeek": 5,
    "startTime": "20:00",
    "endTime": "21:00",
    "title": "Drops RFM",
    "host": "Andreis Feldmann",
    "hostRole": "Apresentador e Produtor RFM",
    "hostAccountId": "host-andreis-feldmann",
    "daysLabel": "Sexta-feira às 20:00",
    "genre": "Lançamentos, Novidades & Pop Rock Alternativo",
    "description": "Pílulas musicais e novidades fresquinhas do indie rock, pop alternativo e lançamentos independentes nacionais e internacionais.",
    "hostBio": "DJ e comunicador versátil da RFM, responsável pela curadoria nostálgica de DasAntigas, lançamentos independentes no Drops RFM e a energia jamaicana no Reggae Rebeldia.",
    "hasReprise": true,
    "repriseDayOfWeek": 6,
    "repriseStartTime": "14:00",
    "repriseEndTime": "15:00",
    "repriseDaysLabel": "Sábado às 14:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/f/e/5/6/2604-01a6-4eb1-9dfa-cad058727e1f",
    "bannerUrl": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/f/e/5/6/2604-01a6-4eb1-9dfa-cad058727e1f",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Radar de Lançamentos",
        "description": "As faixas mais recentes lançadas nas principais plataformas do mundo."
      },
      {
        "title": "Cena Indie Global",
        "description": "O som autoral e inventivo de quem está redefinindo as novas tendências."
      },
      {
        "title": "Drops Rápidos",
        "description": "Curiosidades dos artistas e fichas técnicas dinâmicas a cada canção."
      }
    ],
    "mixcloudUser": "dasantigas",
    "mixcloudUrl": "https://www.mixcloud.com/dasantigas/"
  },
  {
    "id": "prog-reggae-rebeldia",
    "dayOfWeek": 5,
    "startTime": "21:00",
    "endTime": "22:00",
    "title": "Reggae Rebeldia",
    "host": "Andreis Feldmann",
    "hostRole": "Apresentador e Produtor RFM",
    "hostAccountId": "host-andreis-feldmann",
    "daysLabel": "Sexta-feira às 21:00",
    "genre": "Roots Reggae, Dub, Rastafari & Good Vibes",
    "description": "Vibrações positivas na frequência certa! Do roots reggae jamaicano de Bob Marley ao dub e reggae nacional para começar a noite de sexta.",
    "hostBio": "DJ e comunicador versátil da RFM, responsável pela curadoria nostálgica de DasAntigas, lançamentos independentes no Drops RFM e a energia jamaicana no Reggae Rebeldia.",
    "hasReprise": true,
    "repriseDayOfWeek": 0,
    "repriseStartTime": "13:00",
    "repriseEndTime": "14:00",
    "repriseDaysLabel": "Domingo às 13:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/f/e/5/6/2604-01a6-4eb1-9dfa-cad058727e1f",
    "bannerUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/f/e/5/6/2604-01a6-4eb1-9dfa-cad058727e1f",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Lendas da Jamaica",
        "description": "Bob Marley, Peter Tosh, Burning Spear, Jimmy Cliff e Black Uhuru."
      },
      {
        "title": "Reggae Nacional & do Sul",
        "description": "Chimarruts, Ponto de Equilíbrio, Natiruts, Tribo de Jah e bandas autorais."
      },
      {
        "title": "Dub Sessions",
        "description": "Efeitos sonoros profundos e ecos característicos das mixagens jamaicanas."
      }
    ],
    "mixcloudUser": "dasantigas",
    "mixcloudUrl": "https://www.mixcloud.com/dasantigas/"
  },
  {
    "id": "prog-surf-e-acao",
    "dayOfWeek": 5,
    "startTime": "22:00",
    "endTime": "23:00",
    "title": "Surf & Ação (S & A)",
    "host": "Paulo Henrique Farias Gomes (PH)",
    "hostRole": "Apresentador e Produtor de Surf & Ação",
    "hostAccountId": "host-paulo-henrique",
    "daysLabel": "Sexta-feira às 22:00",
    "genre": "Surf Music, Relatório de Ondas & Cultura Praiana",
    "description": "Há mais de 31 anos o surf levado a sério no rádio! Boletim das ondas, previsão marítima, campeonatos mundiais e trilha sonora praiana.",
    "hostBio": "Há mais de 31 anos levando o surf a sério no rádio! Conta com Zé Milanez (monitor de ondas em Torres) e correspondentes na Califórnia, Austrália e litoral brasileiro.",
    "hasReprise": true,
    "repriseDayOfWeek": 6,
    "repriseStartTime": "10:00",
    "repriseEndTime": "11:00",
    "repriseDaysLabel": "Sábado às 10:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/0/2/a/7/71dd-a4d3-4a3a-acbe-575657792573",
    "bannerUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/0/2/a/7/71dd-a4d3-4a3a-acbe-575657792573",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Previsão do Mar com Zé Milanez",
        "description": "Condições do mar em Torres, Tramandaí, Imbé e todo o litoral sul."
      },
      {
        "title": "Circuito Mundial WSL",
        "description": "Notícias dos brasileiros no circuito, manobras e baterias decisivas."
      },
      {
        "title": "Surf Rock Clássico",
        "description": "The Beach Boys, Dick Dale, Jack Johnson, Ben Harper e sons da praia."
      }
    ],
    "mixcloudUser": "SurfeAcao",
    "mixcloudUrl": "https://www.mixcloud.com/SurfeAcao/"
  },
  {
    "id": "prog-bside",
    "dayOfWeek": 6,
    "startTime": "19:00",
    "endTime": "20:00",
    "title": "Bside (Bsides)",
    "host": "Silso Soares",
    "hostRole": "Apresentador e Pesquisador Musical",
    "hostAccountId": "host-silso-soares",
    "daysLabel": "Sábado às 19:00",
    "genre": "Lado B, Raridades, B-Sides & Psicodelia",
    "description": "Raridades esquecidas, lados B de compactos históricos e faixas que não tocaram nas paradas comerciais, mas conquistaram os verdadeiros amantes da boa música.",
    "hostBio": "Radialista dedicado a resgatar raridades e os famosos \"lados B\" da música mundial que passam longe da repetição das rádios comerciais.",
    "hasReprise": true,
    "repriseDayOfWeek": 0,
    "repriseStartTime": "11:00",
    "repriseEndTime": "12:00",
    "repriseDaysLabel": "Domingo às 11:00",
    "avatarUrl": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80",
    "bannerUrl": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Compactos Raros de Vinil",
        "description": "Músicas que saíram apenas em compactos simples de tiragem limitada."
      },
      {
        "title": "Versões Ao Vivo Históricas",
        "description": "Bootlegs e registros raros que não constam na discografia oficial padrão."
      },
      {
        "title": "Histórias do Colecionismo",
        "description": "Relatos de garimpo de discos em feiras e sebos pelo mundo."
      }
    ]
  },
  {
    "id": "prog-american-country",
    "dayOfWeek": 6,
    "startTime": "20:00",
    "endTime": "21:00",
    "title": "American Country Radio Show",
    "host": "Renato Sperb",
    "hostRole": "Apresentador e Pesquisador Musical",
    "hostAccountId": "host-renato-sperb",
    "daysLabel": "Sábado às 20:00",
    "genre": "Country Americano, Bluegrass, Outlaw & Americana",
    "description": "O som autêntico das pradarias americanas: honky tonk, country clássico, bluegrass, southern rock e novidades de Nashville.",
    "hostBio": "Grande pesquisador musical da Rebeldia FM, comanda projetos que vão das pistas de dança (DiscoDécada) à música raiz norte-americana (American Country Radio Show) e ao som de estrada (Soncro).",
    "hasReprise": true,
    "repriseDayOfWeek": 1,
    "repriseStartTime": "10:00",
    "repriseEndTime": "11:00",
    "repriseDaysLabel": "Segunda-feira às 10:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/7/5/7/a/0c4f-3cbd-452c-bd7f-3e7060e04cd0",
    "bannerUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/7/5/7/a/0c4f-3cbd-452c-bd7f-3e7060e04cd0",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Lendas do Outlaw Country",
        "description": "Johnny Cash, Willie Nelson, Waylon Jennings, Merle Haggard e Kris Kristofferson."
      },
      {
        "title": "Bluegrass & Instrumentos de Raiz",
        "description": "Banjos, violinos e mandolins em performances rápidas e emocionantes."
      },
      {
        "title": "Novidades de Nashville",
        "description": "O melhor da nova safra de artistas country independentes dos Estados Unidos."
      }
    ],
    "mixcloudUser": "americancountry",
    "mixcloudUrl": "https://www.mixcloud.com/americancountry/"
  },
  {
    "id": "prog-mix-up",
    "dayOfWeek": 6,
    "startTime": "22:00",
    "endTime": "23:00",
    "title": "Mix Up",
    "host": "REB",
    "hostRole": "Locutor Virtual Oficial 24h",
    "hostAccountId": "host-reb",
    "daysLabel": "Sábado às 22:00",
    "genre": "Set Especial Eletrônico, Rock Mashup & Festa",
    "description": "Set especial mixado na pressão pelo robô programador REB para agitar a noite de sábado com atitude rock e batidas dançantes.",
    "hostBio": "O REB é o robô programador da RFM, responsável por preencher automaticamente a faixa das 00h em todos os dias da semana e os intervalos entre programas, garantindo transmissão contínua na Rebeldia FM.",
    "hasReprise": false,
    "avatarUrl": "/reb_mascot.jpg",
    "bannerUrl": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "/reb_mascot.jpg",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Mixagens Sem Parar",
        "description": "Sequências ininterruptas com batidas eletrônicas e riffs pesados."
      },
      {
        "title": "Mashups Exclusivos",
        "description": "Encontros improváveis de lendas do rock com ritmos dançantes modernos."
      },
      {
        "title": "Aquecimento do Sábado",
        "description": "A energia necessária para reunir os amigos e começar a festa."
      }
    ],
    "mixcloudUser": "reb_mascot",
    "mixcloudUrl": "https://rebeldiafm.com.br"
  },
  {
    "id": "prog-pampa-trip",
    "dayOfWeek": 0,
    "startTime": "10:00",
    "endTime": "12:00",
    "title": "Pampa Trip",
    "host": "Equipe Rebeldia FM",
    "hostRole": "Curadoria Coletiva RFM",
    "hostAccountId": "host-equipe-rfm",
    "daysLabel": "Domingo às 10:00",
    "genre": "Regional Gaúcho, Milonga, Chamamé & Folk Sulista",
    "description": "Música nativista, milongas pampeanas, folk sul-americano e os grandes clássicos da cultura do Rio Grande do Sul.",
    "hostBio": "Coletivo de comunicadores e DJs da Rebeldia FM, garantindo diversidade de estilos e transmissão sem amarras nos domingos da rádio.",
    "hasReprise": false,
    "avatarUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    "bannerUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Nativismo & Poesia Campeira",
        "description": "Vitor Ramil, Bebeto Alves, Cenair Maicá, Noel Guarany e clássicos gaúchos."
      },
      {
        "title": "Chamamés e Milongas",
        "description": "O fole da gaita e as cordas do violão na tradição do pampa sem fronteiras."
      },
      {
        "title": "Tradição & Contemporaneidade",
        "description": "A renovação da música do Sul com arranjos modernos e identidade própria."
      }
    ]
  },
  {
    "id": "prog-churrasquinho",
    "dayOfWeek": 0,
    "startTime": "12:00",
    "endTime": "15:00",
    "title": "Churrasquinho",
    "host": "Equipe Rebeldia FM",
    "hostRole": "Curadoria Coletiva RFM",
    "hostAccountId": "host-equipe-rfm",
    "daysLabel": "Domingo às 12:00",
    "genre": "Samba de Raiz, Pagode 90 & MPB Alegre",
    "description": "O acompanhamento sonoro indispensável para o almoço e churrasco de domingo: samba clássico, pagode retrô e brasilidades festivas.",
    "hostBio": "Coletivo de comunicadores e DJs da Rebeldia FM, garantindo diversidade de estilos e transmissão sem amarras nos domingos da rádio.",
    "hasReprise": false,
    "avatarUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    "bannerUrl": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Samba da Antiga",
        "description": "Cartola, Nelson Cavaquinho, Beth Carvalho, Zeca Pagodinho e Fundo de Quintal."
      },
      {
        "title": "Nostalgia dos Anos 90",
        "description": "Hits que não deixam ninguém parado na roda de samba do meio-dia."
      },
      {
        "title": "Pedidos da Família",
        "description": "Mande seu recado e faça o churrasco ainda mais alegre e acolhedor."
      }
    ]
  },
  {
    "id": "prog-slowww",
    "dayOfWeek": 0,
    "startTime": "15:00",
    "endTime": "16:00",
    "title": "Slowww",
    "host": "Equipe Rebeldia FM",
    "hostRole": "Curadoria Coletiva RFM",
    "hostAccountId": "host-equipe-rfm",
    "daysLabel": "Domingo às 15:00",
    "genre": "Downtempo, Chillout, Ambient & Lo-Fi Beats",
    "description": "Desacelere a mente. Uma hora de sons envolventes, downtempo, texturas sonoras relaxantes e lo-fi para o meio da tarde de domingo.",
    "hostBio": "Coletivo de comunicadores e DJs da Rebeldia FM, garantindo diversidade de estilos e transmissão sem amarras nos domingos da rádio.",
    "hasReprise": false,
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/3/3/f/a/4448-5f78-4475-b9f0-635489427f72",
    "bannerUrl": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/3/3/f/a/4448-5f78-4475-b9f0-635489427f72",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Beats Chill & Lo-Fi",
        "description": "Batidas cadenciadas para estudar, descansar ou simplesmente relaxar no sofá."
      },
      {
        "title": "Paisagens Sonoras",
        "description": "Guitarras etéreas, sintetizadores quentes e instrumentos acústicos suaves."
      },
      {
        "title": "Respiração & Calmaria",
        "description": "Um momento de pausa e equilíbrio antes do início de uma nova semana."
      }
    ],
    "mixcloudUser": "slowww",
    "mixcloudUrl": "https://www.mixcloud.com/slowww/"
  },
  {
    "id": "prog-soncro",
    "dayOfWeek": 0,
    "startTime": "20:00",
    "endTime": "21:00",
    "title": "Soncro",
    "host": "Renato Sperb",
    "hostRole": "Apresentador e Pesquisador Musical",
    "hostAccountId": "host-renato-sperb",
    "daysLabel": "Domingo às 20:00",
    "genre": "Classic Rock, Blues Rock, Som de Estrada & Psico",
    "description": "Rock de estrada, psicodelia anos 70 e atmosferas sonoras de viagem sob a batuta de Renato Sperb.",
    "hostBio": "Grande pesquisador musical da Rebeldia FM, comanda projetos que vão das pistas de dança (DiscoDécada) à música raiz norte-americana (American Country Radio Show) e ao som de estrada (Soncro).",
    "hasReprise": true,
    "repriseDayOfWeek": 2,
    "repriseStartTime": "11:00",
    "repriseEndTime": "12:00",
    "repriseDaysLabel": "Terça-feira às 11:00",
    "avatarUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/e/9/6/3/614e-17d0-474a-b1e5-30704f1cc077",
    "bannerUrl": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://thumbnailer.mixcloud.com/unsafe/600x600/profile/e/9/6/3/614e-17d0-474a-b1e5-30704f1cc077",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Música de Viagem",
        "description": "Pink Floyd, Creedence, Steppenwolf, Neil Young e sons que pedem a rodovia."
      },
      {
        "title": "Psicodelia e Balanços 70s",
        "description": "Guitarras com eco, órgãos Hammond e arranjos imersivos."
      },
      {
        "title": "Histórias do Rock Clássico",
        "description": "Curiosidades de turnês históricas e festivais lendários."
      }
    ],
    "mixcloudUser": "soncro",
    "mixcloudUrl": "https://www.mixcloud.com/soncro/"
  },
  {
    "id": "prog-back-in-blues",
    "dayOfWeek": 0,
    "startTime": "22:00",
    "endTime": "23:59",
    "title": "Back in Blues",
    "host": "Laercio Bitencourt",
    "hostRole": "Apresentador e Pesquisador de Blues",
    "hostAccountId": "host-laercio-bitencourt",
    "daysLabel": "Domingo às 22:00",
    "genre": "Blues Tradicional, Delta Blues & Blues Rock",
    "description": "Fechando a semana com classe, um programa para relaxar ao som do blues de todas as épocas sob o comando de Laercio Bitencourt.",
    "hostBio": "Apresentador e pesquisador apaixonado pelo blues, desvendando raízes, mestres e novas gerações de guitarristas.",
    "hasReprise": true,
    "repriseDayOfWeek": 1,
    "repriseStartTime": "21:00",
    "repriseEndTime": "22:00",
    "repriseDaysLabel": "Segunda-feira às 21:00",
    "avatarUrl": "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=500&auto=format&fit=crop&q=80",
    "bannerUrl": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&auto=format&fit=crop&q=80",
    "logoUrl": "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=500&auto=format&fit=crop&q=80",
    "whatsappNumber": "5548991984678",
    "instagramHandle": "@rebeldiafm",
    "highlights": [
      {
        "title": "Mestres do Blues",
        "description": "B.B. King, Muddy Waters, Buddy Guy, Albert King e Robert Johnson."
      },
      {
        "title": "Novos Artistas do Gênero",
        "description": "A renovação do blues elétrico nos quatro cantos do mundo."
      },
      {
        "title": "Histórias dos Doze Compassos",
        "description": "A alma e a resistência social que deram origem ao blues."
      }
    ]
  }
];

export const INITIAL_REQUESTS: SongRequest[] = [
  {
    id: 'req-rush-1',
    listenerName: 'Marcelo Krauthein',
    city: 'Canoas - RS',
    songTitle: 'The Spirit of Radio',
    artist: 'Rush',
    dedication: 'Dedicado a todos os fãs do rock progressivo e ouvintes fiéis da Rebeldia FM!',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/72/bd/cc/72bdcc25-6dd3-78ea-e86c-4430a091119e/12UMGIM19118.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/39/be/86/39be86aa-dae9-ac93-529b-1ba223a71848/mzaf_9553868739117035855.plus.aac.p.m4a',
    artistBio: 'Rush foi uma célebre banda canadense de rock progressivo formada em 1968 em Toronto por Geddy Lee, Alex Lifeson e Neil Peart.',
    timestamp: Date.now() - 1000 * 60 * 5,
    votes: 42,
  },
  {
    id: 'req-rush-2',
    listenerName: 'Marcelo Krauthein',
    city: 'Canoas - RS',
    songTitle: 'Tom Sawyer',
    artist: 'Rush',
    dedication: 'Um clássico absoluto do álbum Moving Pictures para agitar a transmissão!',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/19/39/78/19397873-9581-13e0-07f3-3071f38527ac/12UMGIM19114.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/cc/9e/ee/cc9eee22-b1ba-537a-dae3-e2dd2ccc3e8e/mzaf_16866705035787590233.plus.aac.p.m4a',
    artistBio: 'Rush é amplamente aclamada por sua maestria técnica em composições complexas, letras conceituais e influências do rock clássico.',
    timestamp: Date.now() - 1000 * 60 * 12,
    votes: 38,
  },
  {
    id: 'req-1',
    listenerName: 'Juliana Silva',
    city: 'São Paulo - SP',
    songTitle: 'Flowers',
    artist: 'Miley Cyrus',
    dedication: 'Para todas as ouvintes da Rebeldia FM nesta tarde maravilhosa!',
    timestamp: Date.now() - 1000 * 60 * 18,
    votes: 24,
  },
  {
    id: 'req-2',
    listenerName: 'Marcos Vinícius',
    city: 'Belo Horizonte - MG',
    songTitle: 'Sweet Child O Mine',
    artist: 'Guns N Roses',
    dedication: 'Para a galera da oficina escutando no rádio ligado!',
    timestamp: Date.now() - 1000 * 60 * 45,
    votes: 19,
  },
  {
    id: 'req-3',
    listenerName: 'Fernanda & Lucas',
    city: 'Curitiba - PR',
    songTitle: 'Tempo Perdido',
    artist: 'Legião Urbana',
    dedication: 'Em homenagem aos nossos 5 anos juntos ouvindo Rebeldia FM!',
    timestamp: Date.now() - 1000 * 60 * 85,
    votes: 31,
  },
  {
    id: 'req-4',
    listenerName: 'Rafael Gomes',
    city: 'Rio de Janeiro - RJ',
    songTitle: 'Save Your Tears',
    artist: 'The Weeknd',
    dedication: 'Toca aí pra animar o trânsito da volta pra casa!',
    timestamp: Date.now() - 1000 * 60 * 120,
    votes: 14,
  },
];

export const INITIAL_MESSAGES: ShoutoutMessage[] = [
  {
    id: 'msg-1',
    author: 'Equipe Rebeldia FM',
    city: 'Estúdio Central',
    message: '🎉 Bem-vindos ao novo App Oficial da Rebeldia FM! Agora você pode instalar no seu celular Android, pedir músicas, acompanhar a programação e deixar seu recado no mural!',
    timestamp: Date.now() - 1000 * 60 * 300,
    likes: 58,
    isPinned: true,
    avatarColor: 'bg-rose-600',
  },
  {
    id: 'msg-2',
    author: 'Ana Carolina',
    city: 'Salvador - BA',
    message: 'Que rádio sensacional! Descobri vocês pelo aplicativo e já virou minha companhia diária no trabalho.',
    timestamp: Date.now() - 1000 * 60 * 150,
    likes: 12,
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'msg-3',
    author: 'Tiago Santos',
    city: 'Porto Alegre - RS',
    message: 'Parabéns pela qualidade sonora em 128 kbps HD! Som limpo sem engasgos aqui pelo 4G.',
    timestamp: Date.now() - 1000 * 60 * 40,
    likes: 8,
    avatarColor: 'bg-emerald-600',
  },
];

export const FEATURE_SUGGESTIONS = [
  {
    id: 'f-1',
    icon: 'Radio',
    title: 'Streaming HD Contínuo & Baixo Delay',
    desc: 'Transmissão Shoutcast de alta fidelidade a 128 kbps com reconexão automática e buffer inteligente para não cortar a música no 3G/4G/5G.',
    status: 'Integrado',
  },
  {
    id: 'f-2',
    icon: 'Download',
    title: 'PWA Completo & Instalação Android/PC',
    desc: 'Instale como aplicativo nativo pelo navegador sem passar pela Play Store. Ícone na tela inicial, inicialização instantânea e splash screen.',
    status: 'Integrado',
  },
  {
    id: 'f-3',
    icon: 'Music2',
    title: 'Central de Pedidos Musicais com WhatsApp',
    desc: 'O ouvinte preenche a música e envia tanto para o mural do app quanto direto para o WhatsApp do estúdio com mensagem formatada.',
    status: 'Integrado',
  },
  {
    id: 'f-4',
    icon: 'Calendar',
    title: 'Grade Semanal & "No Ar Agora" Dinâmico',
    desc: 'Identifica em tempo real qual programa está passando no relógio local com foto do locutor e contagem até o próximo show.',
    status: 'Integrado',
  },
  {
    id: 'f-5',
    icon: 'Sliders',
    title: 'Equalizador de Áudio (Presets Customizados)',
    desc: 'Modos Bass Boost, Rock, Pop, Vocal, Eletrônico e Flat para personalizar o som no fone ou na caixa Bluetooth.',
    status: 'Integrado',
  },
  {
    id: 'f-6',
    icon: 'Clock',
    title: 'Sleep Timer (Temporizador Inteligente)',
    desc: 'Desliga a rádio automaticamente após 15, 30, 45, 60 ou 90 minutos para o ouvinte dormir ouvindo a rádio sem gastar bateria.',
    status: 'Integrado',
  },
  {
    id: 'f-8',
    icon: 'Bell',
    title: 'Despertador Musical da Rádio',
    desc: 'Configure o horário para o app iniciar o streaming automaticamente e acordar com a sua estação favorita.',
    status: 'Integrado',
  },
  {
    id: 'f-9',
    icon: 'Share2',
    title: 'Media Session API (Controles na Tela Bloqueada)',
    desc: 'Exibe capa, nome da rádio e botões de Play/Pause na tela de bloqueio e na barra de notificações do Android.',
    status: 'Integrado',
  },
  {
    id: 'f-10',
    icon: 'MessageSquare',
    title: 'Mural de Recados & Interação da Comunidade',
    desc: 'Espaço interativo para os ouvintes enviarem saudações, curtirem mensagens e interagirem com o estúdio.',
    status: 'Integrado',
  }
];

export const APP_FEATURES_PROPOSAL = FEATURE_SUGGESTIONS;

export const INITIAL_PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'promo-1',
    programId: 'prog-avox-terca',
    programTitle: 'Avox do Brasil',
    title: 'Sorteio Avox: Kit Especial Rebeldia FM',
    subtitle: 'Camiseta Silkada + Boné + Adesivos Resinados',
    description: 'Participe mandando um salve no WhatsApp do estúdio durante o programa. O sorteio acontece toda sexta-feira ao vivo!',
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    badge: 'PROMOÇÃO DA HORA',
    actionText: 'Participar no WhatsApp',
    actionUrl: 'https://wa.me/5548991984678?text=Ol%C3%A1%20Rebeldia%20FM!%20Quero%20concorrer%20ao%20Kit%20Oficial%20da%20Promo%C3%A7%C3%A3o%20da%20Hora!',
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    scheduleSync: true,
    programTimeWindow: { startTime: '19:00', endTime: '20:00', daysLabel: 'Terça-feira às 19:00' },
    isActive: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'promo-2',
    programId: 'prog-acordes-eletricos',
    programTitle: 'Acordes Elétricos',
    title: 'Par de Ingressos VIP para o Festival Rock RS',
    subtitle: 'Acesso liberado com passagem de som no camarim',
    description: 'Ouça a sequência premiada e mande o nome das 3 músicas tocadas no ar para o WhatsApp da rádio. Válido para ouvintes de Canoas e Região Metropolitana.',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    badge: 'SORTEIO ESPECIAL',
    actionText: 'Mandar Resposta no WhatsApp',
    actionUrl: 'https://wa.me/5548991984678?text=Ol%C3%A1%20Rebeldia%20FM!%20Quero%20concorrer%20aos%20ingressos%20do%20Festival%20Rock%20RS!',
    startDate: '2026-01-01T00:00',
    endDate: '2027-12-31T23:59',
    scheduleSync: false,
    isActive: true,
    createdAt: Date.now() - 172800000,
  },
];

export const INITIAL_HOST_ACCOUNTS: HostAccount[] = OFFICIAL_HOSTS;
