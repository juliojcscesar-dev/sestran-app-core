# Número manual de O.S. e cabeçalhos institucionais

## Objetivo
Permitir que usuários que já podem criar O.S. escolham o número inicial, sem risco de duplicidade, e aplicar um único cabeçalho institucional oficial em PDF, DOCX, impressão e relatório de veículos.

## Implementação

### 1. Numeração manual segura
- Exibir em **Nova O.S.** um campo editável já preenchido com a próxima sequência sugerida do ano da data de emissão.
- Aceitar `160` e `160/2026`; normalizar para o padrão `160/2026` e validar números e ano.
- Ao alterar a data de emissão, atualizar a sugestão enquanto o usuário ainda não tiver personalizado o número.
- Mostrar mensagem clara antes do envio quando o número já existir e repetir a validação no banco durante o salvamento.
- Preservar a duplicação com nova sequência sugerida e manter o número bloqueado na edição de uma O.S. existente.

### 2. Integridade no banco
- Atualizar a função de geração para aceitar número manual ou automático dentro da mesma transação.
- Bloquear duplicidades por ano/sequencial no banco, inclusive em salvamentos simultâneos.
- Atualizar `os_contador.ultimo` com `GREATEST(valor_atual, número_informado)`, sem fazer a sequência retroceder.
- Disponibilizar uma consulta segura da próxima sugestão para o formulário, respeitando as permissões existentes de criação.
- Manter todas as tabelas filhas e campos atuais no mesmo fluxo de cadastro.

### 3. Logotipo institucional compartilhado
- Obter o símbolo oficial em fonte institucional e registrar um ativo horizontal único no projeto.
- Usar o mesmo ativo como padrão, mantendo compatibilidade com o logotipo configurável já existente.
- Centralizar o logotipo no PDF da O.S. com aproximadamente 65 × 10 mm e compactar o cabeçalho para manter identificação e dados do serviço na primeira página.
- Inserir o logotipo no cabeçalho real do DOCX, centralizado e proporcional.
- Adicionar cabeçalho institucional centralizado na impressão da tela da O.S., com regras A4.
- Incluir o logotipo antes do título no relatório PDF de veículos abandonados, inclusive ao iniciar uma nova página quando necessário.

## Validação
- Verificar sugestão anual, formatos simples/completos, duplicidade e avanço do contador após número manual maior.
- Confirmar que serviços, agentes, orientadores, percurso, interdições e observações continuam sendo salvos.
- Gerar e inspecionar visualmente PDF e DOCX da O.S. e PDF de veículos, além da impressão A4.
- Executar os testes relevantes e confirmar a verificação automática do projeto sem erros.
