import { validDate, countNights, todayInVietnam } from '../trip.js';

export function validateBooking(input, capacity = null, today = todayInVietnam()) {
  const body = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const errors = {};
  const checkin = validDate(body.checkin), checkout = validDate(body.checkout);
  const guests = Number(body.guests), rooms = Number(body.rooms);
  if (!checkin) errors.checkin = 'date_required';
  else if (checkin < today) errors.checkin = 'date_past';
  if (!checkout) errors.checkout = 'date_required';
  else if (checkin && checkout <= checkin) errors.checkout = 'date_order';
  else if (countNights(checkin, checkout) > 365) errors.checkout = 'stay_too_long';
  if (!Number.isInteger(rooms) || rooms < 1 || rooms > 5) errors.rooms = 'rooms_invalid';
  if (!Number.isInteger(guests) || guests < 1 || guests > 100) errors.guests = 'guests_invalid';
  else if (capacity && Number.isInteger(rooms) && guests > capacity * rooms) errors.guests = 'capacity_exceeded';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim().replace(/\s+/g, ' ') : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (fullName.length < 2 || fullName.length > 100 || /[\x00-\x1f]/.test(fullName)) errors.fullName = 'name_invalid';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'email_invalid';
  if (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15) errors.phone = 'phone_invalid';
  if (message.length > 1000 || /\x00/.test(message)) errors.message = 'message_invalid';
  if (body.accepted !== true) errors.accepted = 'accept_required';
  return { errors, value: { propertyId: body.propertyId, roomTypeId: body.roomTypeId, checkin, checkout, guests, rooms, fullName, email, phone, message, nights: countNights(checkin, checkout) } };
}
