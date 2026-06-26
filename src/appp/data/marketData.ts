// Données du marché - Actions tunisiennes disponibles
export interface MarketStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  /** Raw values for re-formatting (e.g. after detail fetch) */
  volumeRaw?: number | null;
  capMarketRaw?: number | null;
  type: "stock" | "crypto" | "etf";
  chart: { value: number }[];
  favorite?: boolean;
  establishedYear?: number; // Année de création de l'entreprise
}

// Fonction pour générer des données de graphique historiques
export const generateHistoricalData = (
  symbol: string, 
  currentPrice: number, 
  timeframe: '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | 'ALL'
): { date: string; value: number }[] => {
  const data: { date: string; value: number }[] = [];
  let points = 0;
  let dateFormat = '';
  let volatility = 0.02; // Volatilité par défaut

  switch (timeframe) {
    case '1D':
      points = 24; // 24 heures
      dateFormat = 'hour';
      volatility = 0.005;
      break;
    case '7D':
      points = 7;
      dateFormat = 'day';
      volatility = 0.01;
      break;
    case '1M':
      points = 30;
      dateFormat = 'day';
      volatility = 0.015;
      break;
    case '3M':
      points = 90;
      dateFormat = 'day';
      volatility = 0.02;
      break;
    case '6M':
      points = 26; // 26 semaines
      dateFormat = 'week';
      volatility = 0.025;
      break;
    case '1Y':
      points = 52; // 52 semaines
      dateFormat = 'week';
      volatility = 0.03;
      break;
    case '3Y':
      points = 36; // 36 mois
      dateFormat = 'month';
      volatility = 0.04;
      break;
    case 'ALL':
      points = 120; // 10 ans de données mensuelles
      dateFormat = 'month';
      volatility = 0.05;
      break;
  }

  // Générer des données avec une tendance générale à la hausse
  let basePrice = currentPrice * (1 - (points * volatility / 2));
  
  for (let i = 0; i < points; i++) {
    const randomChange = (Math.random() - 0.4) * volatility * basePrice;
    const value = Math.max(basePrice + randomChange, basePrice * 0.5);
    basePrice = value;

    let dateLabel = '';
    const now = new Date();
    
    if (dateFormat === 'hour') {
      const hour = 24 - (points - i);
      dateLabel = `${hour}h`;
    } else if (dateFormat === 'day') {
      const date = new Date(now);
      date.setDate(date.getDate() - (points - i));
      dateLabel = `${date.getDate()}/${date.getMonth() + 1}`;
    } else if (dateFormat === 'week') {
      const date = new Date(now);
      date.setDate(date.getDate() - ((points - i) * 7));
      dateLabel = `${date.getDate()}/${date.getMonth() + 1}`;
    } else if (dateFormat === 'month') {
      const date = new Date(now);
      date.setMonth(date.getMonth() - (points - i));
      dateLabel = `${date.getMonth() + 1}/${date.getFullYear()}`;
    }

    data.push({ date: dateLabel, value: parseFloat(value.toFixed(2)) });
  }

  // S'assurer que le dernier point est le prix actuel
  data[data.length - 1].value = currentPrice;

  return data;
};

export const marketData: MarketStock[] = [
  {
    symbol: "BIAT",
    name: "Banque Internationale Arabe de Tunisie",
    price: 92.50,
    change: 3.20,
    changePercent: 3.58,
    volume: "2.4M",
    marketCap: "1.85B TND",
    type: "stock",
    chart: [
      { value: 89 },
      { value: 90 },
      { value: 89.5 },
      { value: 91 },
      { value: 91.5 },
      { value: 92.5 },
    ],
  },
  {
    symbol: "STB",
    name: "Société Tunisienne de Banque",
    price: 14.20,
    change: 0.35,
    changePercent: 2.53,
    volume: "1.8M",
    marketCap: "568M TND",
    type: "stock",
    chart: [
      { value: 13.8 },
      { value: 13.9 },
      { value: 14 },
      { value: 13.95 },
      { value: 14.1 },
      { value: 14.2 },
    ],
  },
  {
    symbol: "POULINA",
    name: "Poulina Group Holding",
    price: 24.80,
    change: 1.15,
    changePercent: 4.86,
    volume: "985K",
    marketCap: "1.24B TND",
    type: "stock",
    chart: [
      { value: 23.5 },
      { value: 23.8 },
      { value: 24 },
      { value: 24.3 },
      { value: 24.5 },
      { value: 24.8 },
    ],
  },
  {
    symbol: "BNA",
    name: "Banque Nationale Agricole",
    price: 8.45,
    change: -0.15,
    changePercent: -1.74,
    volume: "1.2M",
    marketCap: "422M TND",
    type: "stock",
    chart: [
      { value: 8.7 },
      { value: 8.6 },
      { value: 8.65 },
      { value: 8.55 },
      { value: 8.5 },
      { value: 8.45 },
    ],
  },
  {
    symbol: "SFBT",
    name: "Société Franco-Tunisienne des Biscuits",
    price: 19.75,
    change: 0.85,
    changePercent: 4.50,
    volume: "456K",
    marketCap: "395M TND",
    type: "stock",
    chart: [
      { value: 18.9 },
      { value: 19.1 },
      { value: 19.3 },
      { value: 19.4 },
      { value: 19.6 },
      { value: 19.75 },
    ],
  },
  {
    symbol: "DELICE",
    name: "Délice Holding",
    price: 35.40,
    change: 1.80,
    changePercent: 5.36,
    volume: "752K",
    marketCap: "885M TND",
    type: "stock",
    chart: [
      { value: 33.6 },
      { value: 34 },
      { value: 34.5 },
      { value: 34.8 },
      { value: 35.1 },
      { value: 35.4 },
    ],
  },
  {
    symbol: "TT",
    name: "Tunisie Telecom",
    price: 9.10,
    change: 0.25,
    changePercent: 2.82,
    volume: "3.1M",
    marketCap: "2.73B TND",
    type: "stock",
    chart: [
      { value: 8.85 },
      { value: 8.9 },
      { value: 8.95 },
      { value: 9 },
      { value: 9.05 },
      { value: 9.1 },
    ],
  },
  {
    symbol: "AMEN",
    name: "Amen Bank",
    price: 28.60,
    change: -0.40,
    changePercent: -1.38,
    volume: "892K",
    marketCap: "715M TND",
    type: "stock",
    chart: [
      { value: 29.2 },
      { value: 29 },
      { value: 28.9 },
      { value: 28.8 },
      { value: 28.7 },
      { value: 28.6 },
    ],
  },
  {
    symbol: "UIBC",
    name: "Union Internationale de Banques",
    price: 18.30,
    change: 0.55,
    changePercent: 3.10,
    volume: "624K",
    marketCap: "458M TND",
    type: "stock",
    chart: [
      { value: 17.8 },
      { value: 17.9 },
      { value: 18 },
      { value: 18.1 },
      { value: 18.2 },
      { value: 18.3 },
    ],
  },
  {
    symbol: "MONOPRIX",
    name: "Société Monoprix",
    price: 42.50,
    change: 2.10,
    changePercent: 5.20,
    volume: "328K",
    marketCap: "340M TND",
    type: "stock",
    chart: [
      { value: 40.4 },
      { value: 41 },
      { value: 41.5 },
      { value: 42 },
      { value: 42.3 },
      { value: 42.5 },
    ],
  },
  {
    symbol: "SOTRAPIL",
    name: "Société de Transport des Produits Pétroliers",
    price: 55.80,
    change: -1.20,
    changePercent: -2.11,
    volume: "215K",
    marketCap: "669M TND",
    type: "stock",
    chart: [
      { value: 57.5 },
      { value: 57 },
      { value: 56.5 },
      { value: 56.2 },
      { value: 56 },
      { value: 55.8 },
    ],
  },
  {
    symbol: "SOTUVER",
    name: "Société Tunisienne de Verreries",
    price: 7.25,
    change: 0.15,
    changePercent: 2.11,
    volume: "485K",
    marketCap: "145M TND",
    type: "stock",
    chart: [
      { value: 7.1 },
      { value: 7.12 },
      { value: 7.15 },
      { value: 7.18 },
      { value: 7.22 },
      { value: 7.25 },
    ],
  },
];