"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { products as initialProducts, productTitle, type Locale, type ModelCode, type Product } from "@/lib/catalog";
import { mattressLayers } from "@/lib/mattress-layers";
import { dictionary } from "@/lib/dictionary";

type LayerStyle = CSSProperties & { "--depth": string; "--closed-z": string; "--lift": string };

export function HeroCutaway({ locale,products=initialProducts }: { locale: Locale;products?:Product[] }) {
  const t = dictionary(locale);
  const [model, setModel] = useState<ModelCode>(products[0]?.model||"2601");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const progress = useRef(0);
  const layers = mattressLayers[model];
  const product = products.find(p => p.model === model);

  function setProgress(value: number) {
    progress.current = value;
    root.current?.style.setProperty("--explode", String(value));
    root.current?.setAttribute("data-progress", value.toFixed(3));
    if (range.current) range.current.value = String(Math.round(value * 100));
  }

  useEffect(() => {
    const section = root.current?.closest<HTMLElement>(".hero-scroll");
    if (!section) return;
    let frame = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      frame = 0;
      if (!section) return;
      const sticky = section.querySelector<HTMLElement>(".hero-grid");
      const top = document.querySelector("header")?.getBoundingClientRect().height || 0;
      const travel = section.offsetHeight - (sticky?.offsetHeight || section.offsetHeight);
      const value = motion.matches ? 1 : travel > 0 ? Math.min(1, Math.max(0, (top - section.getBoundingClientRect().top) / travel)) : 0;
      setProgress(value);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);

  const visible = layers[Math.min(active, layers.length - 1)];
  function moveLayer(delta: number) { setActive((value) => (value + delta + layers.length) % layers.length); }

  if(!product)return null;
  return <div className="cutaway-root" ref={root} data-model={model} data-progress="0">
    <div className="cutaway-heading"><span>{t.insideEyebrow}</span><span>{product.height} {t.cm}</span></div>
    <div className="cutaway-models" role="group" aria-label={t.modelChoice}>
      {products.map(p => <button type="button" key={p.model} aria-pressed={model === p.model} onClick={() => { setModel(p.model); setActive(0); }}>{p.name}</button>)}
    </div>
    <div className="cutaway-viewer" aria-label={`${t.cutawayLabel}: ${productTitle(product)}`}>
      <div className="cutaway-orbit" aria-hidden="true"/><div className="cutaway-shadow" aria-hidden="true"/>
      <div className="cutaway-assembly">
        {layers.map((layer, index) => {
          const closedZ = layers.slice(index).reduce((sum, l) => sum + l.visualDepth, 0);
          const style: LayerStyle = { "--depth": `${layer.visualDepth}px`, "--closed-z": `${closedZ}px`, "--lift": `${(layers.length - 1 - index) / Math.max(layers.length - 1, 1) * 200}px` };
          return <div key={`${model}-${layer.id}`} className={`cutaway-layer material-${layer.material}${index === active ? " is-active" : ""}`} style={style}>
            <button type="button" className="cutaway-surface" aria-label={`${index + 1}. ${layer.name[locale]} — ${layer.detail[locale]}`} aria-pressed={index === active} onClick={() => setActive(index)}>
              {layer.material === "springs" && <span className="coil-field" aria-hidden="true"/>}
              <span className="cutaway-layer-number" aria-hidden="true">{String(index + 1).padStart(2,"0")}</span>
            </button>
            <div className="cutaway-front" aria-hidden="true"/><div className="cutaway-side" aria-hidden="true"/>
          </div>;
        })}
      </div>
      <span className="cutaway-product-name">{productTitle(product)}</span>
      <span className="cutaway-scroll-hint"><ArrowDown size={13}/>{t.scrollToExplore}</span>
    </div>
    <div className="cutaway-controls"><label htmlFor="cutaway-explode">{t.assembled}</label><input ref={range} id="cutaway-explode" aria-label={t.explodeControl} type="range" min="0" max="100" defaultValue="0" onChange={event => setProgress(Number(event.target.value) / 100)}/><span>{t.exploded}</span></div>
    <div className="cutaway-info" aria-live="polite" aria-atomic="true"><div className="cutaway-info-index"><Layers size={17}/><span>{String(active + 1).padStart(2,"0")} / {String(layers.length).padStart(2,"0")}</span></div><div className="cutaway-info-text"><strong>{visible.name[locale]}</strong><p>{visible.detail[locale]}</p></div><div className="cutaway-layer-nav"><button type="button" onClick={() => moveLayer(-1)} aria-label={t.previousLayer}><ChevronLeft size={17}/></button><button type="button" onClick={() => moveLayer(1)} aria-label={t.nextLayer}><ChevronRight size={17}/></button></div></div>
    <p className="cutaway-note">{t.cutawayNote}</p>
  </div>;
}
