import { productNames, type ModelCode } from "@/lib/catalog";

// Schematic only, deliberately not presented as an actual product photograph.
export function MattressIllustration({ model = "2601", label }: { model?: ModelCode; label: string }) {
  return <div className={`mattress-scene model-${model}`} role="img" aria-label={label}>
    <div className="scene-circle"/><div className="scene-ground"/>
    <div className="bed-illustration"><div className="bed-side"/><div className="bed-top"/><div className="bed-piping"/></div>
    <span className="scene-label">{productNames[model]}</span>
  </div>;
}
