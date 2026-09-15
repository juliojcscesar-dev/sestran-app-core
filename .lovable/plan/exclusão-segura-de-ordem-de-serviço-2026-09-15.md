# Exclusão segura de Ordem de Serviço

## O que será feito
- Restringir a exclusão no banco a `ADMINISTRADOR` e a `GESTOR`, mantendo Operador e Consulta sem acesso.
- Garantir que somente os registros diretamente vinculados à O.S. sejam removidos em cascata, sem afetar agentes, eventos, orientadores ou solicitantes.
- Adicionar `excluirOrdem(id)` e integrar a ação na listagem, visualização e edição.
- Exibir sempre o diálogo solicitado antes da exclusão, com ação destrutiva e bloqueio durante o processamento.
- Após sucesso, mostrar confirmação, atualizar os dados e voltar para `/ordens-servico` quando necessário.

## Detalhes técnicos
- Ajustar política `DELETE` de `ordens_servico`, permissões SQL e chaves estrangeiras das tabelas filhas diretas.
- Reutilizar a verificação de papéis já existente para ocultar os controles aos demais perfis; o banco continuará sendo a proteção definitiva.
- Validar tipagem e executar teste funcional autenticado da confirmação, cancelamento, exclusão e redirecionamento.
