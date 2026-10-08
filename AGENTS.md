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
