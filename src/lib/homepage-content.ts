import type { Locale } from "./catalog";

export type BrandVideo = {
  id: string;
  title: Record<Locale, string>;
  src: string;
  poster?: string;
};
export type CustomerReview = {
  id: string;
  author: string;
  text: Record<Locale, string>;
  city?: string;
};
export type StoreLocation = {
  id: string;
  city: Record<Locale, string>;
  address: Record<Locale, string> | null;
  kind: Record<Locale, string> | null;
  hours: Record<Locale, string> | null;
  // Exact shop URL only after the owner supplies a verified address.
  mapUrl: string | null;
  cityMapUrl: string;
};

// Videos render only with real materials; reviews show an honest empty state.
export const brandVideos: BrandVideo[] = [];
export const customerReviews: CustomerReview[] = [];

// Public business contact details. Populate only with owner-provided values.
export const storeContacts: {
  instagramUsername: string | null;
  whatsappNumber: string | null;
  phoneNumber: string | null;
} = {
  instagramUsername: "matt.resskz",
  whatsappNumber: "+7 (705) 821-61-03",
  phoneNumber: "+7 (705) 821-61-03",
};

// The owner confirmed these cities; no store coordinates or addresses supplied.
export const storeLocations: StoreLocation[] = [
  { id: "almaty", city: { ru: "Алматы", kk: "Алматы" }, address: null, kind: null, hours: null, mapUrl: null,
    cityMapUrl: "https://www.google.com/maps/search/?api=1&query=Almaty%2C+Kazakhstan" },
  { id: "astana", city: { ru: "Астана", kk: "Астана" }, address: null, kind: null, hours: null, mapUrl: null,
    cityMapUrl: "https://www.google.com/maps/search/?api=1&query=Astana%2C+Kazakhstan" },
];
