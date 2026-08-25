import type { SeededCoin } from "./types"

const spanishCommemorativeCoinTitlesAndYears = [
  ["400 Aniversario de la 1a. edición del «Don Quijote de la Mancha»", 2005],
  ["50 Aniversario del Tratado de Roma", 2007],
  ["10 Aniversario de la Unión Económica y Monetaria", 2009],
  ["Centro Histórico de Córdoba (Patrimonio Mundial UNESCO)", 2010],
  ["Alhambra de Granada (Patrimonio Mundial UNESCO)", 2011],
  ["10 Aniversario de las Monedas y Billetes de Euro", 2012],
  ["Catedral de Burgos (Patrimonio Mundial UNESCO)", 2012],
  ["Monasterio de San Lorenzo de El Escorial (Patrimonio Mundial UNESCO)", 2013],
  ["Parc Güell (Patrimonio Mundial UNESCO)", 2014],
  ["Cambio de Trono Felipe VI de España", 2014],
  ["Cueva de Altamira (Patrimonio Mundial UNESCO)", 2015],
  ["30 Aniversario de la Bandera de la Unión Europea", 2015],
  ["Acueducto de Segovia (Patrimonio Mundial UNESCO)", 2016],
  ["Iglesia de Santa María del Naranco (Patrimonio Mundial UNESCO)", 2017],
  ["50 Aniversario del Rey Felipe VI", 2018],
  ["Ciudad Vieja de Santiago de Compostela (Patrimonio Mundial UNESCO)", 2018],
  ["Ciudad Vieja de Ávila (Patrimonio Mundial UNESCO)", 2019],
  ["Arquitectura Mudéjar de Aragón (Patrimonio Mundial UNESCO)", 2020],
  ["Ciudad Histórica de Toledo (Patrimonio Mundial UNESCO)", 2021],
  ["500 Aniversario de la Primera Vuelta al Mundo", 2022],
  ["Parque Nacional de Garajonay (Patrimonio Mundial UNESCO)", 2022],
  ["35 Aniversario del Programa Erasmus", 2022],
  ["Ciudad Vieja de Cáceres (Patrimonio Mundial UNESCO)", 2023],
  ["Presidencia en Consejo de la Unión Europea", 2023],
  ["200 Aniversario de la Policía Nacional", 2024],
  ["Catedral, Alcázar y Archivo de Indias de Sevilla (Patrimonio Mundial UNESCO)", 2024],
  ["Ciudad Vieja de Salamanca (Patrimonio Mundial UNESCO)", 2025],
  ["España y la discapacidad: protección, derechos e inclusión", 2026],
  ["Monasterio de Poblet (Patrimonio Mundial UNESCO)", 2026],
] as const

const spanishCommemorativeCoinSeedData = {
  compositionDescription:
    "Outer ring: 75% copper, 25% nickel. Core: 75% copper, 20% zinc, 5% nickel",
  compositionCode: "bimetallic",
  currencyCode: "euro",
  diameter: 25.75,
  distributionCode: "circulating-commemorative",
  edgeCode: "lettered-signs-numbers-reeded",
  faceValueNumericValue: 2,
  faceValueText: "2 Euros",
  isDemonetized: false,
  issuerCode: "spain",
  mintage: 8000000,
  orientationCode: "medal-alignment",
  rimCode: "raised-not-decorated-both-sides",
  shapeCode: "circular",
  techniqueCode: "milled",
  thickness: 2.2,
  weight: 8.5,
  createdAt: new Date("2026-01-12T00:00:00.000Z"),
  updatedAt: new Date("2026-01-12T00:00:00.000Z"),
} as const

export const seededCoins: SeededCoin[] =
  spanishCommemorativeCoinTitlesAndYears.map(([title, year]) => ({
    ...spanishCommemorativeCoinSeedData,
    title,
    minYear: year,
    maxYear: year,
  }))
