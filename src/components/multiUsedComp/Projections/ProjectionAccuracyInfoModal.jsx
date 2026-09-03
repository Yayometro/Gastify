"use client";

import React from "react";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import CategoIcon from "../CategoIcon";

function ProjectionAccuracyInfoModal({ onClose }) {
  return (
    <BasicModal
      close={onClose}
      renderContent={
        <div className="content absolute bg-slate-100 border-2 border-purple-600 flex flex-col w-[95%] max-w-[550px] max-h-[85%] rounded-2xl items-center overflow-y-auto z-[1001] p-6">
          <div
            className="close-con absolute top-2 right-2 border-2 rounded-full bg-slate-50 text-purple-700 p-1 cursor-pointer"
            onClick={onClose}
          >
            <CategoIcon type={"MdClose"} siz={20} />
          </div>
          <h1 className="text-2xl text-purple-800 mb-4">Cómo leer esta tabla</h1>

          <div className="w-full flex flex-col gap-4 text-left">
            <div>
              <p className="font-bold text-purple-700">Proyectado vs. Real</p>
              <p className="text-sm text-gray-600">
                &quot;Proyectado&quot; es lo que esperabas para ese mes según lo que tenías
                configurado en ese momento (buffer, o tu referencia histórica) — no se recalcula
                después, así que editar hoy un mes ya cerrado no cambia lo que ese mes
                &quot;proyectaba&quot;. &quot;Real&quot; es lo que tus transacciones dicen que pasó
                de verdad.
              </p>
            </div>
            <div>
              <p className="font-bold text-purple-700">Desajuste — dos números, uno por renglón</p>
              <p className="text-sm text-gray-600">
                El de <span className="font-semibold">arriba</span> es sobre tu{" "}
                <span className="font-semibold">ingreso</span>: Ingreso real menos Ingreso
                proyectado. El de <span className="font-semibold">abajo</span> es sobre tu{" "}
                <span className="font-semibold">gasto</span>: Gasto real menos Gasto proyectado.
                No están relacionados entre sí — cada uno compara su propia columna.
              </p>
            </div>
            <div>
              <p className="font-bold text-purple-700">Por qué el color no sigue el signo igual en los dos</p>
              <p className="text-sm text-gray-600">
                El color siempre significa lo mismo — verde: te fue mejor de lo esperado; rojo: te
                fue peor — pero &quot;mejor&quot; se ve distinto para cada uno:
              </p>
              <ul className="text-sm text-gray-600 list-disc pl-5 mt-1 flex flex-col gap-1">
                <li>
                  <span className="font-semibold">Ingreso:</span> más dinero real del que
                  proyectabas es bueno → un número <span className="text-green-700 font-semibold">positivo es verde</span>,
                  uno <span className="text-red-700 font-semibold">negativo es rojo</span>.
                </li>
                <li>
                  <span className="font-semibold">Gasto:</span> gastar menos de lo proyectado es
                  bueno → un número <span className="text-green-700 font-semibold">negativo es verde</span>,
                  uno <span className="text-red-700 font-semibold">positivo es rojo</span>.
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                Por eso un mismo mes puede mostrar un renglón en rojo y el otro en verde a la vez —
                son dos comparaciones independientes, no un total combinado.
              </p>
            </div>
            <div>
              <p className="font-bold text-purple-700">Ejemplo</p>
              <p className="text-sm text-gray-600">
                Proyectabas $50,000 de gasto y gastaste $47,000 → desajuste de gasto = -$3,000,
                verde (gastaste menos). Proyectabas $80,000 de ingreso y ganaste $60,000 →
                desajuste de ingreso = -$20,000, rojo (ganaste menos).
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default ProjectionAccuracyInfoModal;
