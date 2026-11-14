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
- O.S. saved names (solicitantes, eventos, locais, agentes, orientadores) are renamed/removed inside SeletorRegistro; removal sets ativo=false behind a trigger requiring module EXCLUIR, so issued orders keep their links.
- Store map visual styles in the existing percurso JSON; store raster annotations in mapa_imagem to preserve compatibility without new tables.
- Keep map image editing in a separate canvas component with an annotation layer so the eraser cannot damage the base map.
- Map layer visibility is local presentation state in separate Leaflet groups; it must never delete saved geometry or change document captures.
- Vehicle manual situation overrides legacy date-derived status; notifications retain the fifteen-day deadline, and hidden legacy fields are preserved on edit.
- Educational reports store bounded, browser-compressed image data and image presentation settings on the existing action record; this keeps report content and history saved atomically under existing RLS.
- Final vehicle and educational documents use dedicated authenticated sibling routes and printable components; this preserves calendar/list parent routes and enables direct document navigation without changing existing order documents.
- Handle stale lazy-loaded assets centrally with a session-guarded document reload and a manual retry fallback; retrying a cached rejected import cannot fetch the current deployment.
- Authorize module reads and writes through user_module_permissions and acesso_modulo RLS, not legacy global operator roles; keep destructive permission separate and administration server-validated to prevent cross-module escalation.
- Gate every module form and direct create/edit/duplicate page with the same module permission as RLS; use explicit confirmation and single-row deletion checks so denied operations never appear successful.
- Store optional text formatting as prefixed, validated text runs in existing string fields; share parsing across editors, safe React rendering and document exports to preserve legacy plain text without HTML injection.
- Keep dashboard calendars in a shared presentation component, with independent month/day selection; link records to existing document routes rather than duplicating mutation flows.
- The Painel reads every module summary through the painel_dados security-definer function (any active user with at least one released module, fixed columns only); entry links, routes and table RLS stay module-gated, so seeing a summary never grants module access.
- Installability is manifest-only (public/manifest.webmanifest + icons) with the Chrome/Edge install prompt captured globally in src/lib/instalacao.ts; no app-shell service worker, so previews and deploys never serve stale caches.
- Prebundle calendar, educational scroll-list and React Query dependencies with React at preview startup; session-guard recovery only recognizes known calendar mismatches or React Query stacks with differing optimizer hashes, preventing mixed React generations without masking ordinary hook bugs.
- Fill module reports through one shared editor component and one shared image helper, with photos optional so a report may hold text alone; this keeps the order and educational documents identical without duplicating validation.
- Summarize oversized history values when writing them (resumo_valor_hist) and render history through resumoHistorico; raw base64 or long JSON inside history strings stretches the page on every screen size and bloats the history table.
- Share institutional logo presentation between the sign-in page and application sidebar using CDN asset pointers; the public home uses the supplied portal image as a single intact asset, keeping document branding and authentication unchanged.

- Educational category catalogs use stable text IDs and joined names; category, school and theme removal deactivates options with module deletion permission, preserving historical action links. The all-activities list reads paginated summaries independently of calendar filters.
- Educational list actions load full records only on demand and reuse the existing form for edits and unsaved duplication; status totals share the unfiltered summary query to include older activities without fetching report images.
- Collected-vehicle observation images are bounded, browser-compressed JPEG data stored atomically on the vehicle under existing RLS; a dedicated image editor and shared validator keep attachments separate from legacy observation text and safe in printed sheets.
- Agenda and vehicle final documents share the institutional sheet pieces in src/components/FolhaDocumento.tsx and the agenda-* CSS; keeps screen and print identical to the generated PDF layout.
- Pre-system Idoso/PcD credentials live in the read-only credenciais_historico table (CREDENCIAIS consult RLS, no write policies); the consultation and the renewal search merge it client-side with credenciais_vagas via mesclarConsulta (latest system emission per group + number wins), so issued credentials appear live without copying rows; numbering of new credentials stays independent of it.
- The standalone agent schedule stores agent situations in its existing shared JSON state; browser-native helpers validate the choices and default legacy agents without a situation to active, preserving existing events and schedule calculations.
- Agent integrations (MCP) live in src/lib/mcp with read-only tools using the caller's OAuth token so module RLS decides visibility; never use admin clients there.
