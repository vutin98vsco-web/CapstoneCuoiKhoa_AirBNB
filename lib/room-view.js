export function roomCardData(room) {
  return Object.fromEntries(['id', 'tenPhong', 'viTri', 'category', 'dataSource', 'giaTien', 'referencePrice', 'hinhAnh', 'coverCaption', 'khach', 'phongNgu', 'phongTam'].map(key => [key, room[key]]).concat([['roomTypeCount', room.roomTypes?.length || 0]]));
}

// A hotel's starting rate must never become a selected room category's rate.
export function bookingOfferFor(room, selected) {
  if (!selected) return room;
  return selected.price ? { referencePrice: selected.price } : null;
}
