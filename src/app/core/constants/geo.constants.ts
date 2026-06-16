export const UF_COORDS: Record<string, [number, number]> = {
  'AC': [-10.02, -67.81], 'AL': [-9.65, -35.74], 'AP': [0.04, -51.07], 'AM': [-3.12, -60.02],
  'BA': [-12.97, -38.50], 'CE': [-3.73, -38.52], 'DF': [-15.78, -47.93], 'ES': [-20.32, -40.29],
  'GO': [-16.67, -49.25], 'MA': [-2.53, -44.30], 'MG': [-19.92, -43.94], 'MS': [-20.47, -54.62],
  'MT': [-15.60, -56.10], 'PA': [-1.45, -48.49], 'PB': [-7.12, -34.88], 'PR': [-25.43, -49.27],
  'PE': [-8.05, -34.90], 'PI': [-5.09, -42.80], 'RJ': [-22.90, -43.20], 'RN': [-5.80, -35.21],
  'RO': [-8.76, -63.90], 'RR': [2.82, -60.67], 'RS': [-30.03, -51.23], 'SC': [-27.59, -48.54],
  'SE': [-10.91, -37.07], 'SP': [-23.55, -46.63], 'TO': [-10.18, -48.33]
};

export const CITY_COORDS: Record<string, [number, number]> = {
  'Sao Paulo': [-23.5505, -46.6333],
  'Rio de Janeiro': [-22.9068, -43.1729],
  'Curitiba': [-25.4284, -49.2733],
  'Joinville': [-26.3044, -48.8487],
  'Caxias do Sul': [-29.1678, -51.1794],
  'Feira de Santana': [-12.2664, -38.9663],
  'Anapolis': [-16.3281, -48.9534],
  'Joao Pessoa': [-7.1153, -34.8610],
  'Uberlandia': [-18.9146, -48.2754],
  'Itacoatiara': [-3.1431, -58.4449],
  'Blumenau': [-26.9155, -49.0707],
  'Sobral': [-3.6891, -40.3480],
  'Belo Horizonte': [-19.9167, -43.9345],
  'Brasilia': [-15.7939, -47.8828],
  'Florianopolis': [-27.5949, -48.5482],
  'Porto Alegre': [-30.0346, -51.2177],
  'Salvador': [-12.9777, -38.5016],
  'Recife': [-8.0476, -34.8770],
  'Fortaleza': [-3.7319, -38.5267],
  'Manaus': [-3.1190, -60.0217],
  'Campinas': [-22.9056, -47.0608],
  'Goiânia': [-16.6869, -49.2648],
  'Goiania': [-16.6869, -49.2648],
  'Sao Luis': [-2.5297, -44.3028],
  'Vitoria': [-20.3155, -40.3128],
  'Maceio': [-9.6658, -35.7350],
  'Aracaju': [-10.9472, -37.0731],
  'Teresina': [-5.0919, -42.8034],
  'Palmas': [-10.1840, -48.3336],
  'Natal': [-5.7945, -35.2110]
};

export const CITY_TO_UF: Record<string, string> = {
  'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Curitiba': 'PR', 'Porto Alegre': 'RS',
  'Belo Horizonte': 'MG', 'Salvador': 'BA', 'Brasília': 'DF',
  'Joinville': 'SC', 'Caxias do Sul': 'RS', 'Feira de Santana': 'BA', 'Anápolis': 'GO',
  'João Pessoa': 'PB', 'Uberlândia': 'MG', 'Itacoatiara': 'AM', 'Blumenau': 'SC',
  'Sobral': 'CE', 'Campinas': 'SP', 'Goiânia': 'GO', 'São Luís': 'MA',
  'Vitória': 'ES', 'Maceió': 'AL', 'Aracaju': 'SE', 'Teresina': 'PI',
  'Palmas': 'TO', 'Natal': 'RN', 'Florianópolis': 'SC', 'Recife': 'PE', 'Fortaleza': 'CE',
  'Manaus': 'AM'
};

export function getUFCoords(uf: string | undefined): [number, number] | null {
  const c = UF_COORDS[uf || ''];
  return c || null;
}

export function getCityCoords(uf: string | undefined, cidade: string | undefined): [number, number] | null {
  const cityRaw = (cidade || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const key = cityRaw.replace(/\s+/g, ' ').trim();
  const cityCoords = CITY_COORDS[key];
  if (cityCoords) return cityCoords;
  return getUFCoords(uf);
}

