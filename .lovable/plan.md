# Concluir Educação no Trânsito e documentos com mapa

## Resultado
- Transformar “Educação no Trânsito” em um módulo operacional, preservando os módulos existentes.
- Disponibilizar calendário mensal, semanal e diário, além de uma lista de apoio, com situação visível em cada ação.
- Garantir que PDF e DOCX da Ordem de Serviço tragam automaticamente a imagem do percurso salvo.

## Educação no Trânsito
- Completar a estrutura de dados das ações com categoria, horários, tema, local, responsável, público, participantes, observações, situação e arquivamento.
- Aplicar as situações **Agendada**, **Em andamento**, **Realizada** e **Cancelada**, com validações e permissões já usadas no sistema.
- Registrar criação, edição, mudança de situação, arquivamento e restauração no histórico.
- Criar cadastro, edição, visualização e arquivamento sem exclusão definitiva.
- Reutilizar escolas e orientadores existentes, com pesquisa e seleção; permitir temas reutilizáveis sem inserir dados oficiais fictícios.

## Calendário
- Criar alternância entre **Mês**, **Semana**, **Dia** e **Lista**.
- Incluir navegação anterior/próximo, botão “Hoje”, indicação clara do período e situação por cor/etiqueta.
- Exibir ações no dia e horário corretos, com título, categoria, escola/local e situação.
- Permitir filtrar por situação, categoria, escola, orientador e período, mantendo estados vazios honestos.
- Abrir os detalhes da ação diretamente a partir do calendário.
- Incluir áreas rápidas para atividades de hoje, futuras e realizadas.

## Painel e navegação
- Liberar o módulo no menu.
- Integrar os indicadores e próximas ações do painel aos filtros correspondentes do calendário.
- Atualizar o texto de etapa do painel para refletir os módulos realmente disponíveis.

## PDF e DOCX da O.S.
- Manter a geração automática da imagem a partir do percurso e das interdições salvos.
- Confirmar a presença da imagem nos dois formatos, com proporção legível, texto alternativo no DOCX e sem quebrar documentos sem percurso.

## Validação
- Testar cadastro, edição, mudança de situação, filtros, arquivamento, histórico e recarregamento das ações.
- Testar as visões mensal, semanal e diária em desktop e tela menor.
- Gerar PDF e DOCX de uma O.S. com percurso, validar os arquivos e revisar visualmente o PDF.
- Confirmar verificação de tipos e execução sem erros no navegador.

## Detalhes técnicos
- Alterações de banco serão aditivas, com permissões, proteção por usuário autenticado e políticas de acesso no backend.
- O calendário será implementado com os componentes e tokens visuais já usados pelo projeto, sem trocar a navegação ou o desenho institucional.
- A imagem do mapa continuará sendo gerada no navegador a partir dos dados geoespaciais existentes, sem serviço externo pago.
