import { brandVideos, customerReviews } from "@/lib/homepage-content";
import { dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/catalog";
import { MessageSquareText } from "lucide-react";

export function HomepageMedia({ locale }: { locale: Locale }) {
  const t = dictionary(locale);
  return <>
    {brandVideos.length > 0 && <section className="container section brand-videos" id="videos">
      <p className="eyebrow">VELORA / {t.videoEyebrow}</p><h2>{t.videoTitle}</h2>
      <div className="brand-video-grid">{brandVideos.map(video => <figure key={video.id}>
        <video controls preload="none" playsInline poster={video.poster} aria-label={video.title[locale]}>
          <source src={video.src}/><a href={video.src}>{video.title[locale]}</a>
        </video><figcaption>{video.title[locale]}</figcaption>
      </figure>)}</div>
    </section>}
  </>;
}

export function HomepageReviews({ locale }: { locale: Locale }) {
  const t = dictionary(locale);
  return <section className="section customer-reviews" id="reviews" aria-labelledby="reviews-title"><div className="container">
    <div className="section-heading"><div><p className="eyebrow">07 / {t.reviewsEyebrow}</p><h2 id="reviews-title">{t.reviewsTitle}</h2></div><p>{t.reviewsIntro}</p></div>
    {customerReviews.length > 0 ?
      <div className="review-grid">{customerReviews.map(review => <figure key={review.id}>
        <blockquote><p>{review.text[locale]}</p></blockquote>
        <figcaption>{review.author}{review.city && <span> · {review.city}</span>}</figcaption>
      </figure>)}</div> :
      <div className="reviews-empty"><MessageSquareText size={38} strokeWidth={1.2} aria-hidden="true"/><div><h3>{t.reviewsEmptyTitle}</h3><p>{t.reviewsEmptyText}</p></div></div>
    }
  </div></section>;
}
