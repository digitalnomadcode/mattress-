import { ArrowUpRight, Instagram, MessageCircle, Phone } from "lucide-react";
import { storeContacts } from "@/lib/homepage-content";
import { dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/catalog";

function phoneDigits(number: string | null) {
  const digits = number?.replace(/[\s()+-]/g, "") || "";
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function StoreContacts({ locale, contacts = storeContacts }: { locale: Locale; contacts?: typeof storeContacts }) {
  const t = dictionary(locale);
  const instagram = contacts.instagramUsername?.replace(/^@/, "");
  const instagramName = instagram && /^[a-zA-Z0-9._]{1,30}$/.test(instagram) ? instagram : null;
  const whatsapp = phoneDigits(contacts.whatsappNumber);
  const phone = phoneDigits(contacts.phoneNumber);
  const cards = [
    { id: "instagram", title: "Instagram", text: t.instagramIntro, Icon: Instagram,
      href: instagramName ? `https://www.instagram.com/${instagramName}/` : null,
      value: instagramName ? `@${instagramName}` : t.socialPending, external: true },
    { id: "whatsapp", title: "WhatsApp", text: t.whatsappIntro, Icon: MessageCircle,
      href: whatsapp ? `https://wa.me/${whatsapp}` : null,
      value: whatsapp ? contacts.whatsappNumber : t.phonePending, external: true },
    { id: "phone", title: t.phoneTitle, text: t.phoneIntro, Icon: Phone,
      href: phone ? `tel:+${phone}` : null,
      value: phone ? contacts.phoneNumber : t.phonePending, external: false },
  ];
  return <section className="section contacts-section" id="contacts" aria-labelledby="contacts-title"><div className="container">
    <div className="section-heading"><div><p className="eyebrow">{t.contacts}</p><h2 id="contacts-title">{t.contactsTitle}</h2></div><p>{t.contactsIntro}</p></div>
    <div className="contacts-grid">{cards.map(({ id, title, text, Icon, href, value, external }) => <article key={id} className="contact-card" data-contact={id}>
      <Icon size={31} strokeWidth={1.3} aria-hidden="true"/>
      <h3>{title}</h3><p>{text}</p>
      {href ? <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} aria-label={`${title}: ${value}`}>
        <span>{value}</span><ArrowUpRight size={18}/>
      </a> : <span className="contact-pending">{value}</span>}
    </article>)}</div>
  </div></section>;
}
