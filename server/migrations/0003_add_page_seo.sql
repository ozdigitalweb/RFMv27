-- Migração 0003: Tabela de SEO & GEO por página (padrão Yoast)
-- Criada conforme Regras 4.1 e 5.2 da NORMAS.md (idempotente e aditiva)

CREATE TABLE IF NOT EXISTS page_seo (
  id serial PRIMARY KEY,
  path text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  keywords text DEFAULT '',
  canonical_url text DEFAULT '',
  og_title text,
  og_description text,
  og_image text,
  og_type text DEFAULT 'website',
  twitter_card text DEFAULT 'summary_large_image',
  geo_region text DEFAULT 'BR-SC',
  geo_placename text DEFAULT 'Florianópolis, Santa Catarina, Brasil',
  geo_position text DEFAULT '-27.5954;-48.5480',
  icbm text DEFAULT '-27.5954, -48.5480',
  schema_type text DEFAULT 'RadioStation',
  json_ld_custom text,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Inserção das páginas padrão (ON CONFLICT DO NOTHING para não sobrescrever edições do admin)
INSERT INTO page_seo (
  path, title, description, keywords, canonical_url,
  og_title, og_description, og_image, og_type,
  geo_region, geo_placename, geo_position, icbm, schema_type
)
VALUES
(
  '/',
  'Rebeldia FM - Rádio Web Livre | Rock, Cultura e Resistência',
  'Ouça a rádio livre e independente 24 horas no ar. Rock clássico, indie, programação autoral, pedidos musicais e mural de recados.',
  'radio livre, rebeldia fm, florianopolis, rock web radio, underground, musica independente',
  'https://rebeldiafm.com.br/',
  'Rebeldia FM - Rádio Web Livre',
  'A verdadeira rádio web livre. Rock, cultura, programas autorais e resistência no ar.',
  '/assets/rebeldia-og.jpg',
  'website',
  'BR-SC',
  'Florianópolis, Santa Catarina, Brasil',
  '-27.5954;-48.5480',
  '-27.5954, -48.5480',
  'RadioStation'
),
(
  '/programas',
  'Grade de Programação Oficial | Rebeldia FM',
  'Confira os 25 programas e 18 locutores oficiais da Rebeldia FM. Rock, punk, blues, hotsites dedicados e reprises.',
  'programacao rebeldia fm, locutores, grade de programas, rock radio, florianopolis sc',
  'https://rebeldiafm.com.br/programas',
  'Programação Oficial - Rebeldia FM',
  'Conheça todos os programas autorais e a equipe de locutores da Rebeldia FM.',
  '/assets/rebeldia-og.jpg',
  'website',
  'BR-SC',
  'Florianópolis, Santa Catarina, Brasil',
  '-27.5954;-48.5480',
  '-27.5954, -48.5480',
  'RadioStation'
),
(
  '/mural',
  'Mural de Recados da Comunidade | Rebeldia FM',
  'Envie seu recado, compartilhe mensagens com os locutores e interaja com os ouvintes da rádio livre.',
  'mural de recados, comunidade rebeldia, ouvintes, interacao, florianopolis sc',
  'https://rebeldiafm.com.br/mural',
  'Mural de Recados dos Ouvintes - Rebeldia FM',
  'Espaço aberto para a voz dos ouvintes. Deixe sua mensagem no ar!',
  '/assets/rebeldia-og.jpg',
  'website',
  'BR-SC',
  'Florianópolis, Santa Catarina, Brasil',
  '-27.5954;-48.5480',
  '-27.5954, -48.5480',
  'Community'
),
(
  '/pedidos',
  'Pedir Música e Votação ao Vivo | Rebeldia FM',
  'Escolha seu som favorito, dedique uma música para alguém especial e vote nas faixas mais pedidas da Rebeldia FM.',
  'pedir musica, top pedidos, votacao musical, rebeldia fm, playlist ouvinte',
  'https://rebeldiafm.com.br/pedidos',
  'Peça sua Música - Rebeldia FM',
  'A programação é você quem faz. Escolha e vote na sua faixa favorita.',
  '/assets/rebeldia-og.jpg',
  'website',
  'BR-SC',
  'Florianópolis, Santa Catarina, Brasil',
  '-27.5954;-48.5480',
  '-27.5954, -48.5480',
  'BroadcastService'
),
(
  '/rebeldia',
  'Manifesto e História | Rebeldia FM - A Rádio Livre',
  'Conheça a história de resistência, arte e liberdade da Rebeldia FM em Florianópolis/SC. Música sem concessões.',
  'historia rebeldia fm, manifesto radio livre, cultura independente florianopolis',
  'https://rebeldiafm.com.br/rebeldia',
  'Manifesto Rebeldia FM - Rádio Web Livre',
  'Nossa história, nossa luta e nosso compromisso com a cultura independente.',
  '/assets/rebeldia-og.jpg',
  'website',
  'BR-SC',
  'Florianópolis, Santa Catarina, Brasil',
  '-27.5954;-48.5480',
  '-27.5954, -48.5480',
  'AboutPage'
)
ON CONFLICT (path) DO NOTHING;
