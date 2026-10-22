"use client";

import React from "react";
import { APP_INFO } from "@gastify/core/info/appInfo";
import type { InfoText } from "@gastify/core/info/createInfo";
import { InfoWindow } from "./InfoTip";

export interface MovementsGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const GUIDE_INFO: InfoText = {
  title: "Transactions details",
  text: "Cómo usar la lista de movimientos: qué es, para qué sirve, cómo usarla y cada filtro, capa por capa.",
};

// One desplegable: closed until the person taps its title.
function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <details className="group rounded-2xl border border-white/15 bg-black/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-bold text-white [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-purple-300 transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4 text-sm leading-relaxed text-purple-100/85">{children}</div>
    </details>
  );
}

// One control of a layer: its name in bold, then what it does and how to use it.
function Control({ name, children }: { name: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="font-semibold text-white">{name}</p>
      <div className="mt-1 flex flex-col gap-1">{children}</div>
    </div>
  );
}

// A layer of the screen, from the top down. Its controls are listed in the order the person meets them.
function Layer({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-purple-300">{title}</p>
      {children}
    </div>
  );
}

function MovementsGuideModal({ open, onClose }: MovementsGuideModalProps): React.JSX.Element | null {
  if (!open) return null;
  return (
    <InfoWindow
      info={GUIDE_INFO}
      onClose={onClose}
      body={
        <div className="flex flex-col gap-3 pt-1">
          <Section title="Qué es">
            <p>
              La lista de todos tus movimientos del periodo que eliges. Cada fila es un gasto o un ingreso. Aquí los buscas, los
              filtras, los editas, los borras y los exportas.
            </p>
          </Section>

          <Section title="Para qué sirve">
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>Revisar que cada movimiento tenga bien su nombre, monto, cuenta, categoría y etiquetas.</li>
              <li>Corregir uno o varios movimientos a la vez.</li>
              <li>Encontrar movimientos repetidos y borrarlos de una vez.</li>
              <li>Sacar un archivo (Excel o JSON) de lo que estás viendo.</li>
            </ul>
          </Section>

          <Section title="Cómo usarlo">
            <ol className="flex list-decimal flex-col gap-1 pl-5">
              <li>Elige el periodo con los controles de fecha: un rango ya armado o uno personalizado.</li>
              <li>Acota la lista con los filtros de la barra. Todos se combinan: se aplican juntos.</li>
              <li>Escribe en el buscador para encontrar por nombre, categoría, subcategoría o etiqueta.</li>
              <li>En cada fila, el lápiz edita el movimiento y el bote lo borra.</li>
              <li>Si necesitas trabajar con varios, activa Select y toca los que quieras.</li>
              <li>Exporta lo que ves con Export data.</li>
            </ol>
          </Section>

          <Section title="Filtros, capa por capa">
            <p>{APP_INFO.filtros.text}</p>

            <Layer title="Capa 1 · Encabezado">
              <Control name="Transactions details y el signo ?">
                <p>Abre esta guía.</p>
              </Control>
              <Control name="From / to">
                <p>Muestra el periodo activo. No se edita aquí: cámbialo con los controles de la barra.</p>
              </Control>
            </Layer>

            <Layer title="Capa 2 · Barra de controles, de izquierda a derecha">
              <Control name="Select ON / OFF">
                <p>
                  Activa el modo selección. Con él encendido, tocar una fila la marca, y aparecen acciones para editar o borrar varias
                  a la vez. Tocarlo otra vez lo apaga y limpia la selección.
                </p>
              </Control>
              <Control name="Periodo predefinido (menú)">
                <p>Elige un rango ya armado, como un mes o los últimos meses.</p>
              </Control>
              <Control name="Rango personalizado (selector de fechas)">
                <p>Elige la fecha de inicio y la de fin del periodo que quieres ver.</p>
              </Control>
              <Control name="Tipo: All transactions / All incomes / All bills">
                <p>Muestra todos los movimientos, solo ingresos o solo gastos.</p>
              </Control>
              <Control name="Legibilidad: All / Readable / Not readable">
                <p>
                  Filtra por la marca de legibilidad de cada movimiento, que puedes cambiar al editarlo. Readable muestra los
                  marcados; Not readable, los que no lo están.
                </p>
              </Control>
              <Control name="Monto exacto (Primary / Native + campo)">
                <p>
                  Escribe un monto y muestra solo los movimientos con ese monto. Primary lo compara con la moneda principal de tu
                  wallet. Native lo compara con la moneda de la cuenta de cada movimiento, y aparece otro menú para elegir la moneda.
                  La × borra el monto.
                </p>
              </Control>
              <Control name="Categoría o subcategoría (botón con el nombre)">
                <p>Abre el selector. Eliges una categoría o una subcategoría, pero no las dos. La × al lado quita ese filtro.</p>
              </Control>
              <Control name="Find duplicates">
                <p>
                  Abre el buscador de duplicados. Marcas los criterios con los que dos movimientos cuentan como iguales (nombre, fecha,
                  monto, categoría y subcategoría) y, si quieres, una tolerancia en días y en monto. Search duplicates los busca;
                  Refresh defaults vuelve a Nombre + Fecha + Monto exactos; Exit duplicate view sale de esa vista. Cuando encuentra
                  repetidos, puedes borrarlos todos de una vez.
                </p>
              </Control>
              <Control name="Export data">
                <p>Elige Excel (.xlsx, se puede volver a importar) o JSON (todos los datos completos) de lo que está filtrado ahora.</p>
              </Control>
              <Control name="Clear filters">
                <p>Quita todos los filtros, incluidos el buscador y el monto exacto.</p>
              </Control>
            </Layer>

            <Layer title="Capa 3 · Buscador">
              <Control name="Search by name, category, subcategory or tag">
                <p>Busca mientras escribes. La × de la derecha lo vacía.</p>
              </Control>
            </Layer>

            <Layer title="Capa 4 · Lista de movimientos">
              <Control name="Cada fila">
                <p>Un movimiento. El lápiz lo edita, el bote lo borra. Con Select encendido, tocar la fila la marca.</p>
              </Control>
            </Layer>
          </Section>
        </div>
      }
    />
  );
}

export default MovementsGuideModal;
