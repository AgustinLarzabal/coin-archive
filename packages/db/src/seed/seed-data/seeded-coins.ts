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

const germanCommemorativeCoinTitlesAndYears = [
  ["Estado Federado de Schleswig-Holstein (Holstentor)", 2006],
  ["Estado Federado de Mecklenburg-Vorpommern (Castillo de Schwerin)", 2007],
  ["Alemania: 50 Aniversario del Tratado de Roma", 2007],
  ["Estado Federado de Hamburg (Iglesia de San Miguel)", 2008],
  ["Alemania: 10 Aniversario de la Unión Económica y Monetaria", 2009],
  ["Estado Federado de Saarland (Iglesia de San Luís)", 2009],
  ["Estado Federado de Bremen (Estatua de Roldán)", 2010],
  ["Estado Federado de Nordrhein-Westfalen (Catedral de Colonia)", 2011],
  ["Alemania: 10 Aniversario de las Monedas y Billetes de Euro", 2012],
  ["Estado Federado de Bayern (Castillo de Neuschwanstein)", 2012],
  ["50 Aniversario de la Firma del Tratado del Elíseo", 2013],
  ["Estado Federado de Baden-Württemberg (Monasterio de Maulbronn)", 2013],
  ["Estado Federado de Niedersachsen (Iglesia de San Miguel de Hildesheim)", 2014],
  ["Estado Federado de Hessen (Iglesia de San Pablo en Frankfurt)", 2015],
  ["25 Aniversario de la Reunificación Alemana", 2015],
  ["Alemania: 30 Aniversario de la Bandera de la Unión Europea", 2015],
  ["Estado Federado de Sachsen (Palacio El Zwinger de Dresde)", 2016],
  ["Estado Federado de Rheinland-Pfalz (Porta Nigra)", 2017],
  ["Estado Federado de Berlín (Palacio de Charlottenburg)", 2018],
  ["100 Aniversario del Nacimiento de Helmut Schmidt", 2018],
  ["70 Aniversario de la Fundación del Bundesrat", 2019],
  ["30 Aniversario de la Caída del Muro de Berlín", 2019],
  ["Estado Federado de Brandenburg (Palacio de Sanssouci)", 2020],
  ["50 Aniversario de la Genuflexión de Varsovia", 2020],
  ["Estado Federado de Sachsen-Anhalt (Catedral de Magdeburgo)", 2021],
  ["Estado Federado de Thüringen (Castillo de Wartburg)", 2022],
  ["Alemania: 35 Aniversario del Programa Erasmus", 2022],
  ["Estado Federado de Hamburg (Filarmónica del Elba)", 2023],
  ["1.275 Aniversario del Nacimiento de Carlomagno", 2023],
  ["Estado Federado de Mecklenburg-Vorpommern (Königsstuhl)", 2024],
  ["175 Aniversario de la Constitución de Fráncfort", 2024],
  ["Estado Federado de Saarland (Saarschleife)", 2025],
  ["35 Aniversario de la Reunificación Alemana", 2025],
  ["150 Aniversario del Nacimiento de Konrad Adenauer", 2026],
  ["Estado Federado de Bremen (Casa del Clima de Bremerhaven)", 2026],
] as const

const andorranCommemorativeCoinTitlesAndYears = [
  ["20 Aniversario de la Adhesión de Andorra al Consejo de Europa", 2014],
  [
    "30 Aniversario de la Mayoría de Edad y los Derechos Políticos a los 18 años",
    2015,
  ],
  ["25 Aniversario del Acuerdo Aduanero con la Unión Europea", 2015],
  ["25 Aniversario de la Radio y Televisión de Andorra", 2016],
  ["150 Aniversario de la Nueva Reforma de 1866", 2016],
  ["Andorra, el País de los Pirineos", 2017],
  ["100 Aniversario del Himno Nacional de Andorra", 2017],
  ["25 Aniversario de la Constitución de Andorra", 2018],
  ["70 Aniversario de la Declaración Universal de los Derechos Humanos", 2018],
  ["Finales de la Copa del Mundo de Esquí Alpino", 2019],
  ["600 Aniversario del Consell de la Terra", 2019],
  ["50 Aniversario del Sufragio Universal Femenino", 2020],
  ["XXVII Cumbre Iberoamericana en Andorra", 2020],
  ["100 Aniversario de la Coronación de Nuestra Señora de Meritxell", 2021],
  ["Cuidemos de nuestros mayores", 2021],
  ["La Leyenda de Carlomagno", 2022],
  [
    "10 Aniversario del Acuerdo Monetario entre Andorra y la Unión Europea",
    2022,
  ],
  ["Fiestas del Solsticio de Verano", 2023],
  ["30 Aniversario de la Adhesión a las Naciones Unidas (ONU)", 2023],
  ["Campeonatos del Mundo de Mountain Bike", 2024],
  ["100 Aniversario del esquí en Andorra", 2024],
  ["Quebrantahuesos", 2025],
  ["Juegos de los Pequeños Estados de Europa", 2025],
] as const

function createCommemorativeCoins(
  titlesAndYears: readonly (readonly [string, number])[],
  issuerCode: "andorra" | "germany" | "spain"
): SeededCoin[] {
  return titlesAndYears.map(([title, year]) => ({
    ...spanishCommemorativeCoinSeedData,
    issuerCode,
    title,
    minYear: year,
    maxYear: year,
  }))
}

export const seededCoins: SeededCoin[] = [
  ...createCommemorativeCoins(
    spanishCommemorativeCoinTitlesAndYears,
    "spain"
  ),
  ...createCommemorativeCoins(germanCommemorativeCoinTitlesAndYears, "germany"),
  ...createCommemorativeCoins(
    andorranCommemorativeCoinTitlesAndYears,
    "andorra"
  ),
]
