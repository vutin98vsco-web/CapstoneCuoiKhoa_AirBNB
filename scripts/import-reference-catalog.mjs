import fs from 'node:fs/promises';

const north = JSON.parse(await fs.readFile('.reference/research-north-central.json', 'utf8'));
const south = JSON.parse(await fs.readFile('.reference/research-south-coast.json', 'utf8'));
const cities = { ...north.cities, ...south };
const properties = [];
for (const [city, records] of Object.entries(cities)) {
  if (records.length < 10) throw new Error(`Not enough properties: ${city}`);
  for (const record of records) {
    if (!/^[a-z]+-\d+$/.test(record.slug) || !(record.price.amount > 0) || !record.sourceUrl.startsWith('https://www.kayak.com/')) throw new Error(`Invalid record: ${record.slug}`);
    const northDate = record.price.sourceDateContext?.includes('14') ? ['2026-11-14', '2026-11-15'] : ['2026-11-21', '2026-11-22'];
    const checkIn = record.price.checkIn || northDate[0];
    const checkOut = record.price.checkOut || northDate[1];
    const date = checkIn.slice(8, 10);
    properties.push({ ...record, city, sourceName: 'KAYAK', capacity: record.capacity || null, bedrooms: record.bedrooms || null,
      price: { ...record.price, checkIn, checkOut, isLive: false, isFromPrice: true,
        context: { vi: `Giá từ trên danh sách KAYAK cho ngày ${date}–${checkOut.slice(8, 10)}/11/2026, tra cứu ngày 18/11/2026. Chưa xác định hạng phòng, thuế và phụ phí.`, en: `KAYAK list from-price for ${date}–${checkOut.slice(8, 10)} November 2026, accessed on 18 November 2026. Room type, taxes and extra charges are unspecified.` },
      },
    });
  }
}
if (new Set(properties.map(item => item.slug)).size !== properties.length) throw new Error('Duplicate properties');
await fs.mkdir('lib/data', { recursive: true });
await fs.writeFile('lib/data/properties.json', JSON.stringify(properties, null, 2) + '\n');
console.log(`Imported ${properties.length} properties in ${Object.keys(cities).length} destinations`);
