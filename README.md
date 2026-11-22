# Designérka

Lokální web appka pro stylistku. Provede klientku od postavy přes barvy a styl až ke
kapsulovému šatníku. Nahrazuje kopírování snímků v Canvě.

1. **Postava** – typ postavy (ručně, nebo orientačně z obvodů) a z něj plynoucí střihy
2. **Barvy** – fotka obličeje se sama vloží do všech kombinací ze šablony
   - *Přehled* všech kombinací, hvězdičkou označíš oblíbené
   - *Prohlížeč*: jedna kombinace na stránku, `←` `→` přepíná, `↑` `↓` skáče po sekcích,
     `F` oblíbené, `D` dvojice vedle sebe
   - *Porovnání* oblíbených vedle sebe
   - *Moje paleta*: barevný typ + 3 neutrální a 3 akcentní barvy
3. **Styl** – až 3 styly a prvky, které chce / nenosí (boty, kabelky, oblečení, detaily)
4. **Šatník** – 30 kousků v jejích barvách a střizích; co nenosí, se nevybere
5. **Outfity** – ťukáním na kousky oblékneš figurínu (tvar podle typu postavy, obličej z fotky);
   appka umí navrhnout 6 kombinací; hotový outfit uložíš
6. **Porovnání** – uložené outfity vedle sebe, dají se upravit nebo smazat

**AI prompt** (u outfitů v krocích 5 a 6) otevře okno s anglickým promptem pro generátor obrázků a
s referenčními obrázky: fotka obličeje + kresba outfitu jako PNG. Appka žádnou AI nevolá, vše se
jen kopíruje nebo stahuje. Texty promptu jsou v `src/data/prompt.ts`.

## Spuštění

```sh
pnpm install
pnpm start      # build + server na http://<IP-počítače>:4173, dostupný v místní síti
pnpm dev        # vývoj s hot reloadem
```

Fotky, ořez a výběr se ukládají jen v prohlížeči zařízení, na kterém appku otevřeš
(IndexedDB + localStorage). Nic se nikam neposílá.

Obsah se upravuje v `src/data/`: barvy šablony (`template.json`, `looks.ts`), typy postav a
střihy (`body.ts`), styly a prvky (`style.ts`), kousky a složení šatníku (`capsule.ts`), pravidla outfitů (`outfit.ts`). Kresba figuríny a oblečení
na ní je v `src/components/Mannequin.tsx`.
