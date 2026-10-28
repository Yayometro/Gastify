import "./demo.css";
import "./demo-details.css";
import "./demo-inputs.css";

export default function DemoLoading() {
  return <div role="status" aria-label="Cargando la demo de Gastify" className="demo-loading">
    <span className="demo-loading-mark">G</span>
    <span>Preparando un espacio con datos de ejemplo…</span>
  </div>;
}
