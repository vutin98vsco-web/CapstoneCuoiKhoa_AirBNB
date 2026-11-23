import Link from 'next/link';
import { dictionary, format } from '../lib/i18n';
import { roomTypeCopy } from '../lib/room-type-copy';
import { formatCurrency, exchangeRate } from '../lib/currency';
import { stayTypes } from '../lib/rooms';
import Icon from './Icon';

export default function StayFilters({ locale, initial = {}, searchFormId }) {
  const t = dictionary(locale);
  const rc = roomTypeCopy[locale];
  const Wrapper = searchFormId ? 'div' : 'form';
  return <Wrapper {...(searchFormId ? { role: 'group' } : { action: '/rooms' })} className="stay-filters" aria-label={t.filterStays}>
    {!searchFormId && ['q', 'guests', 'checkin', 'checkout', 'favorites'].map(key => initial[key] ? <input key={key} type="hidden" name={key} value={initial[key]} /> : null)}
    <label><span className="sr-only">{t.stayType}</span><select form={searchFormId} name="type" defaultValue={initial.type || ''} aria-label={t.stayType}><option value="">{t.stayType}</option>{stayTypes.map(type => <option key={type.id} value={type.id}>{t.stays[type.id][0]}</option>)}</select></label>
    <label><span className="sr-only">{t.priceFilter}</span><select form={searchFormId} name="maxPrice" defaultValue={initial.maxPrice || ''} aria-label={t.priceFilter}><option value="">{t.priceFilter}</option>{[50, 75, 100, 150, 200, 300, 500].map(price => <option key={price} value={price}>{format(t.priceUnder, { price: locale === 'vi' ? `${formatCurrency(price * exchangeRate.usdToVnd, locale, 'VND')} ≈ ${price} USD` : `${formatCurrency(price, locale, 'USD')} ≈ ${formatCurrency(price * exchangeRate.usdToVnd, locale, 'VND')}` })}</option>)}</select></label>
    <label><span className="sr-only">{rc.nav}</span><select form={searchFormId} name="roomCategory" defaultValue={initial.roomCategory || ''} aria-label={rc.nav}><option value="">{rc.nav}</option>{Object.entries(rc.category).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <label><span className="sr-only">{t.amenityFilter}</span><select form={searchFormId} name="amenity" defaultValue={initial.amenity || ''} aria-label={t.amenityFilter}><option value="">{t.amenityFilter}</option>{['wifi', 'bep', 'hoBoi', 'dieuHoa'].map(key => <option key={key} value={key}>{t.amenities[key]}</option>)}</select></label>
    <button form={searchFormId} type="submit" className="apply-filters"><Icon name="sliders" size={17} />{t.applyFilters}</button>
    {(initial.type || initial.maxPrice || initial.roomCategory || initial.amenity) && <Link className="reset-filters" href={`/rooms?${new URLSearchParams(Object.entries(initial).filter(([key, value]) => ['q', 'guests', 'checkin', 'checkout', 'favorites'].includes(key) && value))}`}>{t.resetFilters}</Link>}
  </Wrapper>;
}
