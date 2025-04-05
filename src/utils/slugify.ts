export const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD') // usuwa akcenty (diakrytyki)
    .replace(/[\u0300-\u036f]/g, '') // usuwa pozostałości po diakrytykach
    .toLowerCase()
    .replace(/\s+/g, '-') // zamienia spacje na myślniki
    .replace(/[^\w-]+/g, '') // usuwa znaki specjalne
    .replace(/--+/g, '-') // usuwa wielokrotne myślniki
    .replace(/^-+/, '') // usuwa myślnik z początku
    .replace(/-+$/, ''); // usuwa myślnik z końca
