import { randomUUID } from 'node:crypto';
import { currentUser } from '../auth/session.server.js';
import { bookingStore } from '../bookings/store.server.js';
import { currentProperties, currentCities } from './catalog.server.js';
import { verifyPassword } from '../auth/password.server.js';
import { todayInVietnam } from '../trip.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
export function reject(code, status = 400, fields) { throw Object.assign(new Error(code), { code,status,fields }); }
export async function requireAdmin(cookies) { const user = await currentUser(cookies); if (!user) reject('unauthorized',401); if (user.role !== 'admin') reject('forbidden',403); return user; }
const clean = (value, limit) => typeof value === 'string' ? value.trim().slice(0,limit) : '';
const pair = (value, limit = 2000) => ({ vi: clean(value?.vi,limit),en: clean(value?.en,limit) });
const https = value => { try { return new URL(value).protocol === 'https:' && !new URL(value).username && !new URL(value).password; } catch { return false; } };
export const imagePath = value => typeof value === 'string' && (https(value) || /^\/images\/[a-zA-Z0-9_/-]+\.(?:webp|png|jpe?g)$/.test(value) && !value.includes('..') && existsSync(resolve('public',value.slice(1))));
function checkedPair(value, field, limit, fields) { const result = pair(value,limit); if (!result.vi || !result.en) fields[field] = 'both_languages'; return result; }
function integer(value, min, max) { if (value === '' || value == null) return null; const n = Number(value); return Number.isInteger(n) && n >= min && n <= max ? n : NaN; }
export async function propertyInput(input, prior) {
  const fields = {}, cities = (await currentCities());
  const name = clean(input.name,180); if (name.length < 2) fields.name = 'required';
  const cityId = clean(input.cityId,80); const city = cities.find(city => city.id === cityId); if (!city) fields.cityId = 'required';
  const description = checkedPair(input.description,'description',5000,fields), address = checkedPair(input.address,'address',300,fields);
  const sourceUrl = clean(input.sourceUrl,1500), officialWebsite = clean(input.officialWebsite,1500), cover = clean(input.cover,1500);
  if (!https(sourceUrl)) fields.sourceUrl = 'https_required'; if (officialWebsite && !https(officialWebsite)) fields.officialWebsite = 'https_required';
  if (!imagePath(cover)) fields.cover = 'image_invalid';
  if (Object.keys(fields).length) reject('validation',400,fields);
  const id = prior?.id || `tn-${randomUUID().slice(0,12)}`;
  const changedCover = cover !== prior?.hinhAnh;
  const coverPhoto = changedCover ? { path: cover,sourceUrl,originalUrl: https(cover) ? cover : sourceUrl,kind: 'exterior',caption: { vi: name,en: name },checkedAt: todayInVietnam() } : prior.coverPhoto;
  return { ...prior,id,tenPhong: name,tenPhongEn: name,cityId,viTri: city.name.vi,viTriEn: city.name.en,moTa: description.vi,moTaEn: description.en,address,sourceUrl,officialWebsite,sourceName: prior?.sourceName || 'TNbnb',hinhAnh: cover,coverPhoto,coverCaption: coverPhoto?.caption,
    photos: changedCover ? [{ path: cover,sourceUrl,originalUrl: https(cover) ? cover : sourceUrl }] : prior.photos,
    roomTypes: prior?.roomTypes || [],category: 'hotel',dataSource: 'reference',referencePrice: prior?.referencePrice || null,giaTien: prior?.giaTien || 0 };
}
export function roomInput(input, prior) {
  const fields = {}, name = checkedPair(input.name,'name',180,fields), description = checkedPair(input.description,'description',3000,fields);
  const sourceUrl = clean(input.sourceUrl,1500); if (!https(sourceUrl)) fields.sourceUrl = 'https_required';
  const capacity = integer(input.capacity,1,100), areaM2 = input.areaM2 === '' || input.areaM2 == null ? null : Number(input.areaM2);
  if (Number.isNaN(capacity)) fields.capacity = 'number_invalid'; if (areaM2 !== null && (!Number.isFinite(areaM2) || areaM2 < 1 || areaM2 > 10000)) fields.areaM2 = 'number_invalid';
  const beds = pair(input.beds,300), occupancyNote = pair(input.occupancyNote,500);
  const urls = Array.isArray(input.images) ? input.images.map(url => clean(url,1500)).filter(Boolean) : [];
  if (!urls.length || urls.length > 4 || new Set(urls).size !== urls.length || urls.some(url => !imagePath(url))) fields.images = 'images_invalid';
  let price = null;
  if (input.priceAmount !== '' && input.priceAmount != null) {
    const amount = Number(input.priceAmount), currency = input.priceCurrency;
    const priceSource = clean(input.priceSource,1500), context = pair(input.priceContext,1000);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12 || !['VND','USD'].includes(currency)) fields.priceAmount = 'number_invalid';
    if (!https(priceSource)) fields.priceSource = 'https_required'; if (!context.vi || !context.en) fields.priceContext = 'price_context_required';
    price = { amount,currency,sourceUrl: priceSource,context,checkedAt: todayInVietnam(),isLive: false };
    if (prior?.price && prior.price.amount === amount && prior.price.currency === currency && prior.price.sourceUrl === priceSource && prior.price.context.vi === context.vi && prior.price.context.en === context.en) price = prior.price;
  }
  if (Object.keys(fields).length) reject('validation',400,fields);
  const checkedAt = todayInVietnam();
  return { ...prior,id: prior?.id || `room-${randomUUID().slice(0,8)}`,name,description,category: ['room','suite','apartment','villa'].includes(input.category) ? input.category : 'room',capacity,areaM2,beds: beds.vi && beds.en ? beds : null,occupancyNote: occupancyNote.vi && occupancyNote.en ? occupancyNote : null,sourceUrl,sourceOriginalName: prior?.sourceOriginalName || name.en,sourceName: prior?.sourceName || 'TNbnb',checkedAt,price,
    images: urls.map(url => prior?.images?.find(photo => photo.path === url || photo.url === url) || { path: url,originalUrl: https(url) ? url : sourceUrl,sourceUrl,checkedAt }),
    evidence: { ...prior?.evidence,admin: { sourceUrl,checkedAt,support: 'Manually recorded by a TNbnb administrator from the linked room source.' } } };
}
export async function adminAction(section, input, user, cookies) {
  const db = bookingStore(), store = db.workspace;
  if (section === 'users') {
    if (!['admin','user'].includes(input.role) || typeof input.disabled !== 'boolean' || typeof input.id !== 'string') reject('invalid_request');
    if (!await db.accounts.allowed('admin_password',user.id)) reject('rate_limited',429);
    if (!await verifyPassword(input.currentPassword,(await db.accounts.credentials(user.id))?.password_hash)) { await db.accounts.failure('admin_password',user.id); reject('current_password',403); }
    await requireAdmin(cookies); await db.accounts.clearFailures('admin_password',user.id); await store.manageUser(user.id,input.id,input.role,input.disabled); return;
  }
  if (section === 'properties') {
    const prior = input.id ? (await currentProperties(true)).find(property => property.id === input.id) : null;
    if (input.id && !prior) reject('not_found',404);
    if (input.action === 'archive' || input.action === 'restore') { if (!prior) reject('not_found',404); await store.saveProperty(user.id,prior,input.action === 'archive'); }
    else { const property = await propertyInput(input,prior); await store.saveProperty(user.id,property,Boolean(prior?.archived)); return { id: property.id }; }
    return;
  }
  if (section === 'rooms') {
    const property = (await currentProperties(true)).find(property => property.id === input.propertyId); if (!property) reject('not_found',404);
    const prior = input.id ? property.roomTypes.find(room => room.id === input.id) : null; if (input.id && !prior) reject('not_found',404);
    if (input.action === 'archive' || input.action === 'restore') {
      if (!prior) reject('not_found',404);
      const archived = { ...prior,archived: input.action === 'archive' }; await store.saveProperty(user.id,{ ...property,roomTypes: property.roomTypes.map(room => room.id === prior.id ? archived : room) },Boolean(property.archived)); return;
    }
    const room = roomInput(input,prior), types = prior ? property.roomTypes.map(type => type.id === prior.id ? room : type) : [...property.roomTypes,room];
    await store.saveProperty(user.id,{ ...property,roomTypes: types },Boolean(property.archived)); return { id: room.id };
  }
  if (section === 'cities') {
    const cities = (await currentCities(true)), prior = cities.find(city => city.id === input.id);
    if (input.action === 'archive' || input.action === 'restore') {
      if (!prior) reject('not_found',404); if (input.action === 'archive' && (await currentProperties()).some(property => property.cityId === prior.id)) reject('location_in_use');
      await store.saveCity(user.id,prior,input.action === 'archive'); return;
    }
    const id = prior?.id || clean(input.id,60); if (!/^[a-z][a-z0-9-]{1,59}$/.test(id)) reject('city_id_invalid');
    const fields = {}, name = checkedPair(input.name,'name',100,fields); if (Object.keys(fields).length) reject('validation',400,fields);
    await store.saveCity(user.id,{ id,name },Boolean(prior?.archived)); return;
  }
  if (section === 'bookings') {
    if (!['new','reviewing','contacted','closed'].includes(input.stage) || typeof input.id !== 'string' || typeof input.note !== 'string' || input.note.length > 2000 || typeof input.cancel !== 'boolean') reject('invalid_request');
    await store.manageBooking(user.id,input.id,{ stage: input.stage,note: input.note.trim(),cancel: input.cancel }); return;
  }
  if (section === 'reviews') {
    if (!['published','hidden'].includes(input.status) || typeof input.id !== 'string') reject('invalid_request'); const reason = clean(input.reason,300);
    if (input.status === 'hidden' && reason.length < 5) reject('reason_required'); await store.moderate(user.id,input.id,input.status,reason); return;
  }
  reject('not_found',404);
}
