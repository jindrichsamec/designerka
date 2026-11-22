export type StyleId =
  | 'klasicky'
  | 'elegantni'
  | 'romanticky'
  | 'dramaticky'
  | 'prirozeny'
  | 'kreativni'
  | 'minimal'

export const STYLES: { id: StyleId; name: string; text: string }[] = [
  { id: 'klasicky', name: 'Klasický', text: 'Nadčasové, upravené, čisté linie. Sako, košile, kvalitní materiály.' },
  { id: 'elegantni', name: 'Elegantní', text: 'Sofistikované a dotažené do detailu. Hedvábí, podpatky, decentní šperky.' },
  { id: 'romanticky', name: 'Romantický', text: 'Jemné, ženské, hravé. Volánky, květy, krajka, měkké materiály.' },
  { id: 'dramaticky', name: 'Dramatický', text: 'Výrazné, kontrastní, sebevědomé. Ostré linie a statement kousky.' },
  { id: 'prirozeny', name: 'Přirozený', text: 'Pohodlné, uvolněné, nenucené. Úplety, džíny, ploché boty.' },
  { id: 'kreativni', name: 'Kreativní', text: 'Originální, vrstvené, nečekané kombinace. Vzory a výrazné doplňky.' },
  { id: 'minimal', name: 'Minimalistický', text: 'Jednoduché, čisté, bez zdobení. Hladké plochy, žádná loga.' },
]

export const MAX_STYLES = 3

/** Concrete things she does or does not want in her wardrobe. Ids are referenced by garments. */
export const ELEMENT_GROUPS: { name: string; items: { id: string; name: string }[] }[] = [
  {
    name: 'Boty',
    items: [
      { id: 'lodicky', name: 'Lodičky' },
      { id: 'baleriny', name: 'Baleríny' },
      { id: 'tenisky', name: 'Tenisky' },
      { id: 'masivni-boty', name: 'Masivní boty' },
      { id: 'kotnikove', name: 'Kotníkové boty' },
      { id: 'mokasiny', name: 'Mokasíny' },
      { id: 'kozacky', name: 'Kozačky' },
      { id: 'sandaly', name: 'Sandály na podpatku' },
    ],
  },
  {
    name: 'Kabelky',
    items: [
      { id: 'crossbody', name: 'Crossbody' },
      { id: 'do-ruky', name: 'Kabelka do ruky' },
      { id: 'tvarovana', name: 'Kabelka, co drží tvar' },
      { id: 'mekka', name: 'Měkká kabelka' },
      { id: 'shopper', name: 'Velká taška (shopper)' },
      { id: 'psanicko', name: 'Psaníčko' },
      { id: 'batoh', name: 'Batoh' },
    ],
  },
  {
    name: 'Oblečení',
    items: [
      { id: 'kosilove-saty', name: 'Košilové šaty' },
      { id: 'pouzdrova-sukne', name: 'Pouzdrová sukně' },
      { id: 'ackova-sukne', name: 'Áčková sukně' },
      { id: 'dziny', name: 'Džíny' },
      { id: 'siroke-kalhoty', name: 'Široké kalhoty' },
      { id: 'sako', name: 'Sako' },
      { id: 'kozena-bunda', name: 'Kožená bunda' },
      { id: 'trenckot', name: 'Trenčkot' },
      { id: 'rolak', name: 'Rolák' },
      { id: 'oversize-svetr', name: 'Oversize svetr' },
    ],
  },
  {
    name: 'Detaily a doplňky',
    items: [
      { id: 'tricko-bez-loga', name: 'Tričko bez loga' },
      { id: 'tricko-obrazek', name: 'Tričko s obrázkem' },
      { id: 'velka-loga', name: 'Velká loga' },
      { id: 'vzory', name: 'Vzory' },
      { id: 'krajka', name: 'Krajka' },
      { id: 'flitry', name: 'Flitry' },
      { id: 'vyrazne-naramky', name: 'Výrazné náramky' },
      { id: 'jemne-sperky', name: 'Jemné šperky' },
      { id: 'satek', name: 'Šátek' },
      { id: 'pasek', name: 'Pásek' },
    ],
  },
]

export type Preference = 'yes' | 'no'
