# Roadmap — SESTRAN

## Lista e cadastros da Educação (14/10)
- [ ] Lista de todas as atividades entre Filtros e Calendário com rolagem vertical
- [ ] Retirar Orientador do formulário preservando dados antigos
- [ ] Editar e excluir categorias, escolas e temas com permissões e preservação do histórico
- [ ] Testar lista, cadastros, salvamento e recarregamento

## Logos e identificação da Central de Sistema (14/10)
- [x] Colocar as logos oficiais e os textos solicitados na página principal
- [x] Aplicar uma identificação discreta no menu e atualizar o ícone do navegador
- [x] Conferir página principal em computador, tablet e celular; menu autenticado em computador e celular, sem erros

## Adaptação a computador, tablet e celular (solicitado 13/10)
- [x] Conferir painel, módulos, formulários, documentos e usuários nos três tamanhos de tela
- [x] Fazer as barras de ações quebrarem linha e as tabelas rolarem dentro do próprio quadro
- [x] Impedir que valores longos do histórico alarguem a página; verificar celular sem cortes


## Relatório por período nos três módulos (solicitado 13/10)
- [x] Botão "Relatório" na página inicial de O.S., Veículos Abandonados e Educação
- [x] Escolha de período Dia, Mês, Ano ou Geral com contagem de registros
- [x] Gerar PDF e DOC com cabeçalho institucional; conferir os três módulos no navegador

## Relatório na Ordem de Serviço (solicitado 13/10)
- [x] Guardar texto e até 6 fotos do relatório junto à O.S.
- [x] Preencher no formulário com negrito, itálico e sublinhado; fotos opcionais (salvar só com texto, só com fotos ou vazio)
- [x] Mostrar na visualização e nos documentos PDF e DOCX, escondendo quando vazio
- [x] Conferir cadastro, edição, recarregamento e exportações sem perder as demais funções

## Atualização de dados ao abrir a página (solicitado 13/10)

## Atualização de dados ao abrir a página (solicitado 13/10)
- [x] Retirar a verificação automática de 30 segundos e a nova busca ao voltar para a aba
- [x] Conferir o painel carregando os dados e nenhuma busca nos 45 segundos seguintes

## Painel integrado com calendários (13/10)
- [x] Aplicar o modelo em três colunas com calendários de O.S. e Educação e resumo de veículos
- [x] Ligar datas e registros aos documentos reais, respeitando os acessos por módulo
- [x] Verificar seleção de datas e documento real de O.S., navegação independente dos meses, ausência de erros e largura de 695px; Educação e veículos sem registros ativos na sessão verificada

## Formatação dos textos e etapas do percurso (12/10)
- [x] Ocultar coordenadas no documento final sem alterar a geometria salva
- [x] Negrito, sublinhado e itálico nos campos solicitados da O.S. e Educação
- [x] Preservar formatação na visualização, PDF e DOCX; testar os oito campos, reabertura e exportações locais sem criar registros oficiais

## Regras completas de Consulta e Operador (11/10)
- [x] Revisar todas as telas e operações dos módulos 01, 02 e 03, inclusive acessos diretos
- [x] Garantir Consulta somente leitura, Operador por módulo e exclusão individual autorizada
- [x] Validar 162 combinações, políticas do banco e telas com permissões simuladas sem alterar registros oficiais

## Acessos por módulo (10/10)
- [x] Tela Usuários e Acesso exclusiva do administrador, com matriz 01 O.S., 02 Veículos, 03 Educação; Consulta/Operador e autorização de exclusão
- [x] Restringir novos usuários ao início e aplicar liberações no menu, páginas e banco
- [x] Verificar matriz com 78 testes de permissões, 18 verificações no banco e tela administrativa sem erros

## Recuperação do carregamento do painel (10/10)
- [x] Tratar falhas de arquivos atualizados sem criar repetição de recarregamento
- [x] Verificar painel e recuperação automática

## Agenda educativa e visualização final (solicitado 09/10)
- [x] Adaptar campos da Educação no Trânsito ao modelo anexado
- [x] Relatório com texto e imagens, rotação e tamanho persistidos
- [x] Disponibilizar documento final em Visualizar nos três módulos
- [x] Verificar salvamento, recarregamento e visualização

## Cadastro de veículos (solicitado 08/10)
- [x] Retirar Cor e Data da constatação do formulário e substituir Retirada pelo proprietário por Situação
- [x] Persistir as seis situações preservando histórico e prazo de notificação
- [x] Testar cadastro, edição e recarregamento

## Controles do mapa da O.S. (solicitado 08/10)
- [x] Adicionar ampliar, reduzir, centralizar e alternar as camadas do dashboard
- [x] Validar os controles sem alterar percurso, interdições e recorte

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
- [x] Criar O.S. de teste com percurso e interdições e comparar os dados após recarregar
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

- [x] Recorte personalizado do mapa para documentos da O.S.

## Padronização documental da O.S. (solicitado 22/09)
- [x] Aplicar o modelo institucional anexado na visualização e impressão A4
- [x] Aplicar o mesmo padrão visual no PDF e no DOCX
- [x] Validar tela, impressão e arquivos exportados sem regressões

## Ajustes da O.S. (solicitado 07/10)
- [x] Cadastrar eventos diretamente no campo Evento
- [x] Editar e excluir serviços no formulário, preservando detalhes já salvos
- [x] Adicionar equipes na O.S. e ocultar opções vazias nos documentos finais
- [x] Adaptar ferramentas de mapa conforme o dashboard enviado, preservando recorte e dados
- [x] Validar os fluxos e exportações

## Data com dia da semana na O.S. (solicitado 14/10)
- [x] Mostrar o dia da semana na Data do Serviço da O.S. final (tela, PDF e DOCX)
- [x] Exibir o dia por extenso abaixo do campo Data no formulário
- [x] Conferir os três documentos exportados sem regressões
