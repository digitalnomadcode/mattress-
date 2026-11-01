import { ArrowUpRight, MapPin } from "lucide-react";
import { storeLocations } from "@/lib/homepage-content";
import { dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/catalog";

export function StorePresence({ locale }: { locale: Locale }) {
  const t = dictionary(locale);
  return <section className="presence-section section" id="locations"><div className="container">
    <div className="section-heading"><div><p className="eyebrow">{t.presenceEyebrow}</p><h2>{t.presenceTitle}</h2></div><p>{t.presenceIntro}</p></div>
    <div className="city-grid">{storeLocations.map((location, i) => <article className="city-card" key={location.id}>
      <div className="city-card-top"><MapPin size={29} strokeWidth={1.3}/><span>0{i + 1} / KZ</span></div>
      <h3>{location.city[locale]}</h3>
      {location.kind && <p className="city-kind">{location.kind[locale]}</p>}
      <p className="city-address">{location.address?.[locale] || t.addressPending}</p>
      {location.hours && <p className="city-hours">{location.hours[locale]}</p>}
      <a className="city-map-link" href={location.mapUrl || location.cityMapUrl} target="_blank" rel="noopener noreferrer">
        {location.mapUrl ? t.openLocationMap : t.openCityMap}<ArrowUpRight size={18}/>
      </a>
      {!location.mapUrl && <small>{t.cityMapNote}</small>}
    </article>)}</div>
  </div></section>;
}
