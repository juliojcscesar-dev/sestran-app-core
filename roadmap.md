# Roadmap — SESTRAN

## Etapa 2 — Ordem de Serviço
- [x] Número manual com sugestão anual, normalização e bloqueio de duplicidade
- [x] Cabeçalho institucional oficial em PDF, DOCX, impressão e relatório de veículos
- [x] Corrigir erros de tipagem/build (formulário e componentes)
- [x] Listagem de O.S. com filtros, colunas e ações (visualizar, editar, duplicar, PDF, DOCX, arquivar)
- [x] Página de visualização detalhada com histórico e geração de documentos
- [x] Edição preservando permissões e histórico
- [x] Duplicação com nova numeração ao salvar
- [x] Exclusão irreversível com confirmação e permissão restrita a Administrador/Gestor
- [x] Build 100% verde, Etapa 1 preservada

## Mapa e percurso
- [x] Banco: percurso (jsonb), imagem do mapa e tabela de interdições
- [x] Biblioteca de mapa (Leaflet + OpenStreetMap) e utilidades
- [x] Componente de mapa com pontos, percurso, edição, exclusão, busca de endereço e interdições
- [x] Integração no formulário (salvar) e na visualização (carregar)
- [x] Percurso, interdições e imagem automática do mapa nos documentos PDF/DOCX
- [x] Testar salvamento, edição e carregamento do percurso
- [ ] Criar O.S. de teste com percurso e interdições e comparar os dados após recarregar
- [x] Incluir zoom calculado e escala gráfica na captura usada por PDF e DOCX

## Etapa 3 — Veículos Abandonados (solicitado 11/09)
- [ ] Cadastro completo (endereço, bairro, marca/modelo/placa/chassi, datas, denúncia ouvidoria/informal, observações, fotos)
- [ ] Upload e visualização de múltiplas fotos
- [ ] Ciclo de status com prazo de 15 dias e alerta de "A recolher"
- [ ] Cards do painel com indicadores por status
- [ ] Tela "Cronograma de Veículos" com colunas e filtros
- [ ] Relatório PDF por período, com opção de incluir fotos
- [ ] Histórico de alterações e confirmação de exclusão/arquivamento
- [ ] Mapa de Paranavaí com veículos por ponto e situação, integrado ao cronograma

## Etapa 4 — Educação no Trânsito (solicitado 12/09)
- [x] Categorias: Eventos nas escolas, Blitz educativa, Palestra e outra ação
- [x] Cadastro e seleção de escolas, orientadores e temas reutilizáveis
- [x] Ciclo de status: agendada, em andamento, realizada, cancelada
- [x] Calendário mensal/semanal/diário/lista com filtros
- [x] Áreas rápidas: atividades do dia, futuras e realizadas
- [x] Indicadores clicáveis integrados aos filtros
- [x] Histórico de alterações e confirmação de arquivamento

## Cadastro territorial de Paranavaí (solicitado 14/09)
- [x] Tela de cadastro e pesquisa de bairros e ruas
- [x] Aceitar somente dados reais com fonte oficial e data de atualização, sem carga fictícia
- [x] Integrar a pesquisa oficial de ruas ao mapa e ao percurso das Ordens de Serviço

## Ajustes de navegação e painel (solicitado 19/09)
- [x] Ocultar Solicitantes, Escolas e Ruas e Bairros do menu lateral
- [x] Remover os indicadores de Solicitantes e Escolas do Painel
- [x] Preservar os campos internos, tabelas e dados existentes
