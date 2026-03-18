const db = require('./db');

const sampleProducts = [
  ['Casio G-Shock GA-2100-1A', 'Casio', 'Wrist Watch', 25000.00, 35000.00, 10, '4549526241659'],
  ['Seiko 5 Sports SRPD55K1', 'Seiko', 'Wrist Watch', 45000.00, 65000.00, 5, '4954628232145'],
  ['Rolex Submariner Date', 'Rolex', 'Luxury Watch', 1800000.00, 2500000.00, 2, 'RLX-SUB-001'],
  ['Generic Quartz Clock', 'Unbranded', 'Wall Clock', 800.00, 1500.00, 20, '1234567890123'],
  ['Casio Vintage A168WG-9', 'Casio', 'Wrist Watch', 12000.00, 18000.00, 15, '4971850433293'],
  ['Tissot Le Locle Powermatic 80', 'Tissot', 'Wrist Watch', 85000.00, 120000.00, 3, '7611608264584'],
  ['Casio G-Shock Mudmaster GWG-1000', 'Casio', 'Diver Watch', 95000.00, 135000.00, 8, '4549526101113'],
  ['Seiko Prospex Alpinist SPB121J1', 'Seiko', 'Automatic', 110000.00, 155000.00, 4, '4954628233340'],
  ['Omega Speedmaster Moonwatch', 'Omega', 'Luxury Chrono', 950000.00, 1350000.00, 1, 'OMG-SPD-002'],
  ['Tissot PRX Powermatic 80 Blue', 'Tissot', 'Wrist Watch', 95000.00, 138000.00, 6, '7611608298718'],
  ['Citizen Eco-Drive Promaster', 'Citizen', 'Wrist Watch', 55000.00, 75000.00, 12, '4974374246141'],
  ['Rolex GMT Master II Pepsi', 'Rolex', 'Luxury GMT', 2200000.00, 3100000.00, 1, 'RLX-GMT-003'],
  ['Orient Kamasu Blue Dial', 'Orient', 'Diver Watch', 35000.00, 48000.00, 10, '4942715013585'],
  ['Longines Conquest V.H.P.', 'Longines', 'Quartz High End', 120000.00, 175000.00, 3, '7612307123456'],
  ['IWC Portugieser Chronograph', 'IWC', 'Dress Watch', 850000.00, 1150000.00, 2, 'IWC-POR-001'],
  ['Breitling Navitimer B01', 'Breitling', 'Aviator Watch', 800000.00, 1100000.00, 1, 'BRT-NAV-001'],
  ['Casio Edifice EFR-556DB', 'Casio', 'Chronograph', 15000.00, 22000.00, 10, '4549526145674'],
  ['Seiko Presage Cocktail Time', 'Seiko', 'Dress Watch', 65000.00, 95000.00, 5, '4954628211119'],
  ['Hamilton Khaki Field Auto', 'Hamilton', 'Field Watch', 75000.00, 110000.00, 7, '7640113854123'],
  ['Rado HyperChrome Chronograph', 'Rado', 'Ceramic Watch', 140000.00, 210000.00, 2, 'RAD-HYP-005'],
  ['Fossil Gen 6 Smartwatch Black', 'Fossil', 'Smartwatch', 45000.00, 58000.00, 15, '7964835368910'],
  ['Apple Watch Series 9 GPS', 'Apple', 'Smartwatch', 110000.00, 135000.00, 8, '1942537151010'],
  ['TAG Heuer Formula 1 Quartz', 'TAG Heuer', 'Racing Watch', 180000.00, 265000.00, 4, '7612345678901'],
  ['Cartier Tank Must Large', 'Cartier', 'Iconic Dress', 450000.00, 620000.00, 2, 'CRT-TNK-002'],
  ['Patek Philippe Nautilus 5711', 'Patek Philippe', 'Ultra Luxury', 9500000.00, 14500000.00, 1, 'PP-NTL-5711'],
  ['Audemars Piguet Royal Oak', 'Audemars Piguet', 'Luxury Sports', 6500000.00, 9800000.00, 1, 'AP-ROK-15500'],
  ['Casio Baby-G BGA-280-7A', 'Casio', 'Ladies Watch', 15000.00, 23000.00, 12, '4549526300127'],
  ['Timex Expedition North Solar', 'Timex', 'Outdoors', 18000.00, 28000.00, 20, '1234123456789'],
  ['Zodiac Super Sea Wolf 53', 'Zodiac', 'Premium Diver', 145000.00, 215000.00, 3, '7613309121212'],
  ['Swatch Irony Chrono', 'Swatch', 'Casual', 18000.00, 26000.00, 15, '7610522123456'],
  ['Bulova Lunar Pilot Chrono', 'Bulova', 'Moon Watch', 65000.00, 95000.00, 6, '0424295325950'],
  ['Vacheron Constantin Overseas', 'Vacheron Constantin', 'Luxury Sports', 4500000.00, 7200000.00, 1, 'VC-OVS-4500'],
  ['Grand Seiko Heritage Snowflake', 'Seiko', 'Luxury Spring Drive', 850000.00, 1250000.00, 2, 'GS-HF-001'],
  ['Mido Ocean Star Tribute', 'Mido', 'Diver Watch', 85000.00, 135000.00, 4, '7611608291234'],
  ['Junghans Max Bill Manual', 'Junghans', 'Minimalist', 120000.00, 185000.00, 3, '4000897123456'],
  ['Sinn 104 I St Sa Blue', 'Sinn', 'Tool Watch', 18000.00, 285000.00, 2, '4000104104104']
];

async function seed() {
  try {
    // Collect unique metadata
    const brands = [...new Set(sampleProducts.map(p => p[1]).filter(b => b))];
    const categories = [...new Set(sampleProducts.map(p => p[2]).filter(c => c))];

    const brandIds = {};
    const categoryIds = {};

    // Seed Brands
    for (const b of brands) {
      const { rows } = await db.query('INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', [b]);
      brandIds[b] = rows[0].id;
    }

    // Seed Categories
    for (const c of categories) {
      const { rows } = await db.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', [c]);
      categoryIds[c] = rows[0].id;
    }

    // Seed Products
    for (const p of sampleProducts) {
      const [name, brand, category, cost, selling, stock, barcode] = p;
      await db.query(
        `INSERT INTO products (name, brand_id, category_id, cost_price, selling_price, stock_quantity, barcode)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (barcode) DO UPDATE SET stock_quantity = products.stock_quantity + EXCLUDED.stock_quantity`,
        [name, brandIds[brand], categoryIds[category], cost, selling, stock, barcode]
      );
    }

    console.log('Normalized seeding successful! Timepieces distributed into brands and categories.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
