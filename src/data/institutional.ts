export interface InstitutionalMember {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

export interface InstitutionalPillar {
  iconName: string;
  title: string;
  description: string;
  tag: string;
}

export interface InstitutionalData {
  stationName: string;
  slogan: string;
  foundedYear: string;
  manifestoTitle: string;
  manifestoText: string[];
  historyTitle: string;
  historyText: string[];
  pillars: InstitutionalPillar[];
  team: InstitutionalMember[];
  officialEmail: string;
  pressEmail: string;
  bandsEmail: string;
  whatsapp: string;
  instagram: string;
  location: string;
  studioAddress: string;
  licenseInfo: string;
  transmissionTech: {
    bitrate: string;
    codec: string;
    serverHost: string;
    uptime: string;
    availability: string;
  };
}

export const DEFAULT_INSTITUTIONAL_DATA: InstitutionalData = {
  stationName: 'REBELDIA FM',
  slogan: 'Rádio Livre • O Som que Incomoda o Sistema',
  foundedYear: '2019',
  manifestoTitle: 'Música, cultura e liberdade',
  manifestoText: [
    'A música está presente em todas as culturas, das comunidades tradicionais às grandes cidades. Ouvir ou cantar uma canção pode despertar tristeza, alegria, nostalgia, indignação e muitos outros sentimentos. Quando compartilhadas por grupos de pessoas, essas emoções também podem contribuir para movimentos culturais e sociais.',
    'Ao longo da história, estilos como punk, grunge, rock alternativo, rap e outros movimentos musicais ajudaram a ampliar a liberdade de expressão e a estimular reflexões sobre a sociedade. A música, portanto, não é apenas entretenimento: ela influencia comportamentos, fortalece identidades e participa da formação cultural.',
    'A Rebeldia FM acredita que a diversidade musical é essencial. Não somos contra canções românticas ou qualquer outro tema; somos contra a concentração da programação em um único tipo de conteúdo. Nosso objetivo é abrir espaço para diferentes vozes, estilos, épocas e perspectivas.',
  ],
  historyTitle: '1. Nossa história',
  historyText: [
    'A Rebeldia FM nasceu com o propósito de defender a liberdade de expressão e valorizar a música como uma das mais importantes formas de arte e manifestação humana.',
    'A música traduz sentimentos, ideias, sonhos e experiências. Por isso, a Rebeldia FM foi criada por DJs e profissionais das áreas de jornalismo e comunicação com uma missão clara: apresentar a música em sua melhor forma, incentivar o público a ouvir rádio novamente e oferecer uma programação com identidade.',
    'Acreditamos que música boa não tem prazo de validade nem idade. Nossa programação é eclética e combina lançamentos e clássicos de diferentes épocas e estilos, sempre com curadoria própria e respeito ao ouvinte.',
    'Também não trabalhamos com a lógica do “jabá”. A programação é construída com base na qualidade, na relevância e naquilo que consideramos melhor para o nosso público.',
  ],
  pillars: [
    {
      iconName: 'Flame',
      title: 'Liberdade Sem Jabá',
      description: 'Programação 100% pautada pela curadoria artística e pela qualidade sonora. Aqui ninguém paga para impor músicas.',
      tag: 'Autonomia',
    },
    {
      iconName: 'Radio',
      title: 'Espaço à Cena Independente',
      description: 'Palco aberto para bandas autorais, novos talentos e coletivos musicais que mantêm a chama do rock viva.',
      tag: 'Cultura Viva',
    },
    {
      iconName: 'Users',
      title: 'Comunidade & Interatividade',
      description: 'Ouvintes têm voz ativa no Mural de Recados, pedidos em tempo real, bate-papo com locutores e enquetes.',
      tag: 'Conexão',
    },
    {
      iconName: 'Cpu',
      title: 'Alta Fidelidade Digital',
      description: 'Transmissão HD em 128kbps AAC/MP3 de ultra-baixa latência, equalizador dinâmico e suporte multiplataforma PWA.',
      tag: 'Tecnologia',
    },
  ],
  team: [
    {
      name: 'Carlos "Vortex" Mendes',
      role: 'Diretor Artístico & Fundador',
      bio: 'Produtor musical e radialista há mais de 20 anos, defensor ferrenho da cultura do vinil e do rock de garagem.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    },
    {
      name: 'Juliana "Jules" Rocha',
      role: 'Coordenadora de Jornalismo & Debates',
      bio: 'Jornalista cultural, pesquisa movimentos contraculturais e conduz os especiais temáticos da rádio.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rodrigo "Gordo" Silveira',
      role: 'Chefe de Engenharia de Som & Streaming',
      bio: 'Engenheiro acústico responsável pelo processamento de áudio, DSP em tempo real e estabilidade dos servidores.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    },
    {
      name: 'Fernanda Lima (Voz da Noite)',
      role: 'Locutora & Curadora Musical',
      bio: 'Apresentadora dos programas noturnos de Blues, Post-Rock e sessões acústicas exclusivas.',
      avatar: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&auto=format&fit=crop&q=80',
    },
  ],
  officialEmail: 'radio@rebeldiafm.com.br',
  pressEmail: 'rebeldiafm@gmail.com',
  bandsEmail: 'radio@rebeldiafm.com.br',
  whatsapp: '+55 (48) 99198-4678',
  instagram: '@rebeldiafm',
  location: 'Canoas - RS, Brasil • Transmissão Global Web & App',
  studioAddress: 'Estúdio Central Rebeldia • Canoas - RS, Brasil',
  licenseInfo: 'Emissora Digital Independente Sob Princípios de Rádio Livre e Licença Creative Commons de Conteúdo Próprio.',
  transmissionTech: {
    bitrate: '128 kbps HD',
    codec: 'AAC / MP3 Stereo',
    serverHost: 'Cloud Streaming Cluster (US/BR)',
    uptime: '99.98% 24h/7d',
    availability: 'Mundial (Web + PWA Android/iOS)',
  },
};

const STORAGE_KEY_INSTITUTIONAL = 'rebeldia_institutional_data_v2';

export function getSavedInstitutionalData(): InstitutionalData {
  if (typeof window === 'undefined') return DEFAULT_INSTITUTIONAL_DATA;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_INSTITUTIONAL);
    if (saved) {
      return { ...DEFAULT_INSTITUTIONAL_DATA, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading institutional data:', e);
  }
  return DEFAULT_INSTITUTIONAL_DATA;
}

export function saveInstitutionalData(data: InstitutionalData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_INSTITUTIONAL, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving institutional data:', e);
  }
}
