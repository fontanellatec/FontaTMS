export const ESTADOS_UF: string[] = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

export const CIDADES_POR_UF: Record<string, string[]> = {
  'SP': ['São Paulo', 'Campinas', 'Santos', 'Sorocaba', 'Ribeirão Preto'],
  'RJ': ['Rio de Janeiro', 'Niterói', 'Campos', 'Volta Redonda'],
  'BA': ['Salvador', 'Camaçari', 'Feira de Santana', 'Ilhéus'],
  'PR': ['Curitiba', 'Londrina', 'Maringá'],
  'SC': ['Florianópolis', 'Criciúma', 'Joinville', 'Blumenau'],
  'SE': ['Aracaju', 'Nossa Senhora do Socorro', 'Itabaiana']
};
