import fs from 'node:fs/promises';

const properties = JSON.parse(await fs.readFile('lib/data/properties.json', 'utf8'));
const allowed = new Set(properties.map(property => property.slug));
const combined = {};
for (const group of ['a', 'b', 'c']) {
  const records = JSON.parse(await fs.readFile(`.reference/room-types-${group}.json`, 'utf8'));
  for (const [slug, types] of Object.entries(records)) {
    if (!allowed.has(slug) || combined[slug]) throw new Error(`Unexpected or duplicate property: ${slug}`);
    if (!Array.isArray(types) || types.length < 2) throw new Error(`At least two sourced categories required: ${slug}`);
    const identifiers = new Set();
    combined[slug] = types.map(type => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(type.id) || identifiers.has(type.id)) throw new Error(`Invalid room id: ${slug}/${type.id}`);
      identifiers.add(type.id);
      for (const language of ['vi', 'en']) {
        if (!type.name?.[language] || !type.description?.[language]) throw new Error(`Missing translation: ${slug}/${type.id}/${language}`);
        if (/[?\uFFFD]/.test(type.name[language]) || /\uFFFD/.test(type.description[language])) throw new Error(`Broken text encoding: ${slug}/${type.id}`);
      }
      if (!['room', 'suite', 'apartment', 'villa'].includes(type.category)) throw new Error(`Invalid category: ${slug}/${type.id}`);
      if (!type.images?.length || !type.sourceOriginalName || !/^https:\/\//.test(type.sourceUrl)) throw new Error(`Missing provenance: ${slug}/${type.id}`);
      if (type.price && (!(type.price.amount > 0) || !['USD', 'VND'].includes(type.price.currency) || !type.price.sourceUrl || !type.price.context?.vi || !type.price.context?.en)) throw new Error(`Invalid room rate: ${slug}/${type.id}`);
      return { ...type, price: type.price ? { ...type.price, unit: 'night', isLive: false } : null };
    });
  }
}
if (Object.keys(combined).length !== properties.length) throw new Error(`Room coverage is incomplete: ${Object.keys(combined).length}/${properties.length}`);
await fs.writeFile('lib/data/room-types.json', JSON.stringify(combined, null, 2) + '\n');
console.log(JSON.stringify({ properties: Object.keys(combined).length, roomTypes: Object.values(combined).flat().length, pricedTypes: Object.values(combined).flat().filter(type => type.price).length }));
