-- Migração 0002: Chave Estável para Programas (seed_key)
-- Permite identificar programas oficiais independentemente de alterações de dia, horário ou título
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS seed_key text UNIQUE;
