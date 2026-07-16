import { Vinculo } from '@pages/controle-intencao-viagem/models/controle-intencao-viagem.model';
import { getCityCoords } from '../constants/geo.constants';

export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371; // km
  const toRad = (x: number) => x * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function buildGreedyRoutePlan(
  vincs: Vinculo[],
  start: [number, number]
): Array<{ coords: [number, number]; label: string }> {
  type RouteLoad = {
    origemCoords: [number, number] | null;
    destinoCoords: [number, number] | null;
    origemLabel: string;
    destinoLabel: string;
    origemVisitada: boolean;
    destinoVisitado: boolean;
  };

  const loads: RouteLoad[] = vincs.map(v => ({
    origemCoords: getCityCoords(v.intencao.origem.uf, v.intencao.origem.cidade),
    destinoCoords: getCityCoords(v.intencao.destino.uf, v.intencao.destino.cidade),
    origemLabel: `Origem: ${v.intencao.origem.cidade} - ${v.intencao.origem.uf}`,
    destinoLabel: `Destino: ${v.intencao.destino.cidade} - ${v.intencao.destino.uf}`,
    origemVisitada: false,
    destinoVisitado: false
  }));

  const ordered: Array<{ coords: [number, number]; label: string }> = [
    { coords: start, label: 'Inicio do veiculo' }
  ];
  let current = start;

  while (loads.some(l => !l.destinoVisitado)) {
    let best:
      | { idx: number; tipo: 'origem' | 'destino'; coords: [number, number]; label: string; distance: number }
      | null = null;

    for (let i = 0; i < loads.length; i++) {
      const load = loads[i];
      if (!load.origemVisitada && load.origemCoords) {
        const d = distanceKm(current, load.origemCoords);
        if (!best || d < best.distance) {
          best = { idx: i, tipo: 'origem', coords: load.origemCoords, label: load.origemLabel, distance: d };
        }
      }
      if (load.origemVisitada && !load.destinoVisitado && load.destinoCoords) {
        const d = distanceKm(current, load.destinoCoords);
        if (!best || d < best.distance) {
          best = { idx: i, tipo: 'destino', coords: load.destinoCoords, label: load.destinoLabel, distance: d };
        }
      }
    }

    if (!best) break;

    const samePoint = best.coords[0] === current[0] && best.coords[1] === current[1];
    if (!samePoint) {
      ordered.push({ coords: best.coords, label: best.label });
      current = best.coords;
    }

    if (best.tipo === 'origem') loads[best.idx].origemVisitada = true;
    else loads[best.idx].destinoVisitado = true;
  }

  return ordered;
}
