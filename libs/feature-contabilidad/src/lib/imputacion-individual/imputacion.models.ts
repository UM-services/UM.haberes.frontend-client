export interface CargoImputacion {
  categoriaId: number;
  categoriaNombre: string;
  dependenciaId: number;
  dependenciaAcronimo: string;
  facultadId: number;
  facultadNombre: string;
  geograficaId: number;
  geograficaNombre: string;
  basico: number;
  antiguedad: number;
  cuentaSueldos: number | null;
}

export interface CargoClaseImputacion {
  cargoClaseId: number;
  cargoClaseNombre: string;
  dependenciaId: number;
  dependenciaAcronimo: string;
  facultadId: number;
  facultadNombre: string;
  geograficaId: number;
  geograficaNombre: string;
  basico: number;
  antiguedad: number;
  cuentaSueldos: number | null;
}

export interface CodigoImputacionDetalle {
  codigoId: number;
  codigoNombre: string;
  dependenciaId: number;
  dependenciaAcronimo: string;
  facultadId: number;
  facultadNombre: string;
  geograficaId: number;
  geograficaNombre: string;
  importe: number;
  cuentaSueldos: number | null;
  remunerativo: boolean;
}

export interface TotalesImputacion {
  totalCargosBasico: number;
  totalCargosAntiguedad: number;
  totalClasesBasico: number;
  totalClasesAntiguedad: number;
  totalCodigosImporte: number;
  totalBruto: number;
  totalNoRemunerativo: number;
}

export interface ImputacionIndividualResponse {
  legajoId: number;
  anho: number;
  mes: number;
  cargos: CargoImputacion[];
  cargosClase: CargoClaseImputacion[];
  codigos: CodigoImputacionDetalle[];
  totales: TotalesImputacion;
  diferencia: number;
}

export interface PersonaImputacion {
  legajoId: number;
  documento?: number | string | null;
  apellido?: string;
  nombre?: string;
  apellidoNombre?: string;
}
