# Padronização completa da Ordem de Serviço

## Objetivo
Reproduzir na visualização, impressão, PDF e DOCX o modelo institucional anexado, mantendo intactos cadastro, edição, numeração, permissões, histórico, duplicação, exclusão e mapa.

## Implementação

1. **Folha oficial na visualização**
   - Substituir os cartões atuais do conteúdo imprimível por uma folha A4 com moldura azul, cabeçalho em duas colunas, identificação Nº/Data/IPM, faixa “ORDEM DE SERVIÇO”, quadros de dados, serviços, percurso condicional, equipe, observações condicionais, mapa recortado e assinatura.
   - Estruturar a folha com `a4-table`, usando cabeçalho e rodapé repetíveis na impressão de várias páginas.
   - Manter fora da folha todos os controles atuais: situação, imprimir, PDF, DOCX, duplicar, editar, excluir e histórico.

2. **Conteúdo e regras condicionais**
   - Exibir De/Para, Natureza/Solicitante, Local, Data do serviço, horário inicial, encerramento e Evento na disposição do modelo.
   - Consolidar tipos e detalhes em “1 - Serviço”.
   - Exibir “2 - Percurso” somente quando houver trajeto textual, pontos ou interdições.
   - Listar agentes com matrícula e horário/função/observação; incorporar orientadores na mesma linguagem visual.
   - Ocultar observações e mapa quando estiverem vazios.

3. **Impressão e múltiplas páginas**
   - Criar estilos próprios para tela e impressão A4, com 20 mm no topo, cores institucionais, caixas que evitam cortes e repetição adequada do cabeçalho e assinatura.
   - Remover da impressão toda a interface administrativa e o mapa interativo, imprimindo apenas a folha final.

4. **PDF fiel ao modelo**
   - Refazer o desenho do PDF com cabeçalho institucional, caixa Nº/Data/IPM, faixa azul, quadros preenchidos, tabela de equipe, mapa proporcional e assinatura.
   - Aplicar paginação automática, repetindo identidade visual em páginas adicionais e evitando cortar blocos.

5. **DOCX fiel ao modelo**
   - Refazer o Word com tabelas de largura fixa, sombreamentos e bordas institucionais, logotipo, campos, painéis condicionais, equipe, mapa e assinatura.
   - Configurar A4 e margens equivalentes, permitindo que o conteúdo flua para várias páginas.

6. **Validação**
   - Verificar tipagem e compilação.
   - Abrir uma O.S. real em navegador autenticado e conferir a folha em desktop e na visualização de impressão.
   - Gerar PDF e DOCX; inspecionar visualmente o PDF e validar a estrutura do DOCX.
