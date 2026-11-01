import Link from "next/link";
import "./globals.css";
import "./velora.css";

export default function GlobalNotFound() {
  return <html lang="ru"><body><main className="not-found"><p className="eyebrow">404 / VELORA</p><h1>Страница не найдена</h1><p lang="kk">Қажетті бет табылмады.</p><Link href="/ru/catalog" className="button primary" lang="ru">Открыть каталог</Link><Link href="/kk/catalog" className="button primary" lang="kk">Каталогты ашу</Link></main></body></html>;
}
