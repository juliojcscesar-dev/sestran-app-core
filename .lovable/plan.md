# Recorte personalizado do mapa da O.S.

## Objetivo
Permitir que o usuário escolha no mapa o enquadramento exato usado na Ordem de Serviço, confirme uma captura com percurso, pontos e interdições e preserve essa imagem ao salvar, editar, visualizar e gerar PDF/DOCX.

## Implementação

1. **Seleção e captura no mapa**
   - Adicionar o modo “Recortar área para O.S.” à barra do mapa.
   - No modo de recorte, desenhar um retângulo arrastável sobre o mapa com a mesma proporção da imagem do documento.
   - Destacar visualmente a seleção e oferecer “Confirmar recorte”, “Pré-visualizar” e “Redefinir / Cancelar”.
   - Ao confirmar, converter os limites selecionados em coordenadas geográficas, gerar a imagem em alta resolução e entregá-la ao formulário.

2. **Gerador de imagem**
   - Adicionar um tipo de enquadramento geográfico opcional ao gerador existente.
   - Quando houver limites personalizados, calcular centro e zoom para preencher o canvas dentro desses limites; sem recorte, manter o enquadramento automático atual.
   - Preservar tiles, percurso, marcadores numerados, interdições, escala e crédito do OpenStreetMap.

3. **Formulário e persistência**
   - Inicializar a captura com `mapa_imagem` existente em edição e duplicação.
   - Exibir abaixo do mapa a miniatura confirmada, com ações para alterar o recorte ou restaurar o enquadramento automático.
   - Enviar `mapa_imagem` junto com todos os dados já existentes e persistir na criação e atualização da O.S.

4. **Visualização e documentos**
   - Exibir a captura salva na tela detalhada quando existir, mantendo o mapa interativo como referência.
   - PDF e DOCX continuarão priorizando diretamente `mapa_imagem`; o enquadramento automático será usado apenas quando não houver captura salva.

5. **Validação**
   - Verificar tipagem e compilação.
   - Testar no navegador seleção, pré-visualização, confirmação e restauração automática, além do reaproveitamento da imagem após salvar/recarregar.

## Detalhes técnicos
- A seleção será implementada com eventos de ponteiro do Leaflet e uma camada retangular, sem adicionar biblioteca de desenho.
- O recorte será persistido como PNG em data URL no campo existente `ordens_servico.mapa_imagem`; não haverá alteração de banco.
- O modo de leitura continuará sem controles de edição.
