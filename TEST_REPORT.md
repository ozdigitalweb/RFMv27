# 🎸 Relatório da Rotina de Testes Automatizados - Rebeldia FM

**Data/Hora da Execução**: `06/09/2026, 17:15:26`  
**Ambiente**: `http://localhost:3000`  
**Status Global**: 🟢 **100% APROVADO**  

## 📊 Métricas Consolidadas

| Métrica | Valor |
| :--- | :--- |
| **Total de Operações Testadas** | **34** |
| **Aprovadas (PASS)** | **34** (100.0%) |
| **Falhas (FAIL)** | **0** |
| **Tempo Total de Execução** | **1521ms** |

## 📋 Tabela Detalhada de Operações (Gravação, Edição, Deleção e Conferência)

| Suíte / Módulo | Operação | Descrição | Status | Tempo | Detalhes |
| :--- | :---: | :--- | :---: | :---: | :--- |
| Saúde do Servidor | **INTEGRIDADE** | Verificar endpoint de saúde (/api/health) | ✅ PASSOU | 95ms | Servidor online. Timestamp: 2026-09-06T17:15:24.934Z |
| Estatísticas do Sistema | **CONFERIR** | Consultar métricas consolidadas (/api/stats) | ✅ PASSOU | 134ms | Pedidos: 3 \| Recados: 1 \| Ouvintes: 1 |
| Mural de Recados | **GRAVAR** | Criar novo recado de ouvinte (POST /api/shoutouts) | ✅ PASSOU | 65ms | Recado criado com ID #4 por "Ouvinte QA Automatizado" |
| Mural de Recados | **CONFERIR** | Verificar se o recado gravado está listado (GET /api/shoutouts) | ✅ PASSOU | 36ms | Recado #4 localizado: "Teste automatizado de recado - 1788714925078" (Aprovado: true) |
| Mural de Recados | **EDITAR** | Interagir e dar Like no recado (POST /api/shoutouts/:id/like) | ✅ PASSOU | 41ms | Like registrado com sucesso. Likes atuais: 1 |
| Mural de Recados | **EDITAR** | Moderar e desaprovar recado temporariamente (PUT /api/admin/shoutouts/:id/approve) | ✅ PASSOU | 36ms | Status de moderação alterado para isApproved: false |
| Mural de Recados | **CONFERIR** | Verificar se recado desaprovado sumiu do mural público (GET /api/shoutouts) | ✅ PASSOU | 34ms | Recado #4 devidamente ocultado da listagem pública |
| Mural de Recados | **DELETAR** | Excluir recado de teste do banco (DELETE /api/admin/shoutouts/:id) | ✅ PASSOU | 35ms | Comando de exclusão executado com sucesso para o ID #4 |
| Mural de Recados | **CONFERIR** | Conferir se o recado foi expurgado do banco (GET /api/admin/shoutouts) | ✅ PASSOU | 35ms | Recado #4 completamente removido da base de dados. Integridade confirmada. |
| Pedidos Musicais | **GRAVAR** | Enviar pedido de música (POST /api/song-requests) | ✅ PASSOU | 50ms | Pedido registrado com ID #6: "Pink Floyd - Time - Faixa Teste QA 1788714925362" (Status inicial: pending) |
| Pedidos Musicais | **CONFERIR** | Conferir pedido gravado na lista geral (GET /api/song-requests) | ✅ PASSOU | 43ms | Pedido #6 conferido: "Pink Floyd - Time - Faixa Teste QA 1788714925362" \| Votos: 1 |
| Pedidos Musicais | **EDITAR** | Votar no pedido musical (POST /api/song-requests/:id/vote) | ✅ PASSOU | 42ms | Voto adicionado com sucesso. Votos totais: 2 |
| Pedidos Musicais | **EDITAR** | Atualizar status do pedido pelo painel (PUT /api/admin/song-requests/:id/status) | ✅ PASSOU | 39ms | Status do pedido atualizado para: "approved" |
| Pedidos Musicais | **DELETAR** | Excluir pedido musical de teste (DELETE /api/admin/song-requests/:id) | ✅ PASSOU | 34ms | Pedido #6 deletado com sucesso |
| Pedidos Musicais | **CONFERIR** | Conferir se o pedido foi removido da listagem (GET /api/song-requests) | ✅ PASSOU | 35ms | Pedido #6 expurgado com sucesso. Integridade confirmada. |
| Grade de Programação | **GRAVAR** | Cadastrar novo programa na grade (POST /api/schedule) | ✅ PASSOU | 40ms | Programa cadastrado com ID #16: "Programa Especial Piloto QA 1788714925605" (21:00 - 22:30) |
| Grade de Programação | **CONFERIR** | Localizar programa criado na grade geral (GET /api/schedule) | ✅ PASSOU | 33ms | Programa #16 conferido: "Programa Especial Piloto QA 1788714925605" com reprises configuradas |
| Grade de Programação | **EDITAR** | Editar horário e informações do programa (PUT /api/schedule/:id) | ✅ PASSOU | 69ms | Programa #16 atualizado: Novo horário 20:30-22:00, Gênero: "Rock Progressivo & Blues" |
| Grade de Programação | **CONFERIR** | Conferir persistência dos dados editados na grade (GET /api/schedule) | ✅ PASSOU | 36ms | Persistência verificada com sucesso: "Programa Especial Piloto QA 1788714925605 (Edição Confirmada)" |
| Grade de Programação | **DELETAR** | Excluir programa de teste da grade (DELETE /api/schedule/:id) | ✅ PASSOU | 35ms | Programa #16 excluído com sucesso |
| Grade de Programação | **CONFERIR** | Conferir se o programa foi removido da grade (GET /api/schedule) | ✅ PASSOU | 34ms | Programa #16 removido da grade. Integridade confirmada. |
| Contas de Locutores | **CONFERIR** | Buscar lista atual e criar backup de locutores (GET /api/host-accounts) | ✅ PASSOU | 47ms | Backup realizado com 1 locutores cadastrados. |
| Contas de Locutores | **GRAVAR** | Cadastrar novo locutor de testes (POST /api/host-accounts/register) | ✅ PASSOU | 68ms | Locutor "Locutor Teste QA" (@tester_locutor_1788714925853) registrado com ID host-1788714925933-m11js |
| Contas de Locutores | **CONFERIR** | Realizar login com as credenciais iniciais (POST /api/host-accounts/login) | ✅ PASSOU | 32ms | Login efetuado com sucesso para "Locutor Teste QA". Senha conferida. |
| Contas de Locutores | **EDITAR** | Recuperar e alterar senha do locutor (POST /api/host-accounts/recover-password) | ✅ PASSOU | 64ms | Senha atualizada com sucesso: "Senha redefinida com sucesso! Agora você já pode entrar." |
| Contas de Locutores | **CONFERIR** | Conferir login com a NOVA senha alterada (POST /api/host-accounts/login) | ✅ PASSOU | 35ms | Autenticação com a nova credencial bem-sucedida! |
| Contas de Locutores | **DELETAR** | Remover locutor temporário e restaurar base limpa (POST /api/host-accounts/save-all) | ✅ PASSOU | 69ms | Locutor de testes @tester_locutor_1788714925853 expurgado da lista oficial. Total restante: 1 |
| Contas de Locutores | **CONFERIR** | Verificar se o login falha após a remoção da conta | ✅ PASSOU | 33ms | Login rejeitado adequadamente (HTTP 401). Conta de teste completamente eliminada. |
| Banners Promocionais | **CONFERIR** | Fazer backup dos banners ativos (GET /api/promo-banners) | ✅ PASSOU | 32ms | 0 banners existentes preservados para rollback. |
| Banners Promocionais | **GRAVAR** | Adicionar banner de teste temporário (POST /api/promo-banners) | ✅ PASSOU | 36ms | Banner gravado com ID "test-banner-1788714926234" |
| Banners Promocionais | **CONFERIR** | Conferir se o banner de teste consta na lista (GET /api/promo-banners) | ✅ PASSOU | 33ms | Banner "Campanha de Teste QA" verificado com sucesso |
| Banners Promocionais | **DELETAR** | Remover banner de teste e restaurar lista original (POST /api/promo-banners) | ✅ PASSOU | 34ms | Banners originais restaurados com sucesso (0 itens) |
| Banners Promocionais | **CONFERIR** | Conferir se o banner de teste foi eliminado da listagem | ✅ PASSOU | 33ms | Limpeza confirmada. Zero dados residuais no banco. |
| Streaming & Áudio | **INTEGRIDADE** | Consultar metadados do stream da rádio (/api/stream-metadata) | ✅ PASSOU | 4ms | Título: "josie paulus - All I Hear Is" \| Artista: "josie paulus" \| Faixa: "All I Hear Is" \| Bitrate: 64kbps |

## 🛡️ Auditoria de Integridade e Limpeza de Dados

- **Mural de Recados**: Recado de teste gravado, conferido, curtido, moderado, excluído e confirmado como ausente.
- **Pedidos Musicais**: Pedido gravado, votado, status alterado para 'approved', excluído e validado.
- **Grade de Programação**: Programa completo criado com horários e reprises, editado, conferido e excluído sem deixar resíduos.
- **Contas de Locutores**: Usuário de testes registrado, autenticado, senha redefinida e confirmada com login, em seguida removido e testado contra login indevido.
- **Banners Promocionais**: Banner gravado, verificado no feed, e lista original restaurada mantendo consistência 100% intacta.
- **Streaming e Sistema**: Endpoints de integridade (`/api/health`, `/api/stats`, `/api/stream-metadata`) respondendo com latência ultrarrápida.
