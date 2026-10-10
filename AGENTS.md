<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- O.S. service deletion deactivates catalog types; it never removes references from issued orders, preserving historical documents.
- Store map visual styles in the existing percurso JSON; store raster annotations in mapa_imagem to preserve compatibility without new tables.
- Keep map image editing in a separate canvas component with an annotation layer so the eraser cannot damage the base map.
- Map layer visibility is local presentation state in separate Leaflet groups; it must never delete saved geometry or change document captures.
- Vehicle manual situation overrides legacy date-derived status; notifications retain the fifteen-day deadline, and hidden legacy fields are preserved on edit.
- Educational reports store bounded, browser-compressed image data and image presentation settings on the existing action record; this keeps report content and history saved atomically under existing RLS.
- Final vehicle and educational documents use dedicated authenticated sibling routes and printable components; this preserves calendar/list parent routes and enables direct document navigation without changing existing order documents.
- Handle stale lazy-loaded assets centrally with a session-guarded document reload and a manual retry fallback; retrying a cached rejected import cannot fetch the current deployment.
- Authorize module reads and writes through user_module_permissions and acesso_modulo RLS, not legacy global operator roles; keep destructive permission separate and administration server-validated to prevent cross-module escalation.
