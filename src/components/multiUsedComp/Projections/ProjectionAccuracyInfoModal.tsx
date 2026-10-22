"use client";

import React from "react";
import { APP_INFO } from "@gastify/core/info/appInfo";
import { InfoWindow } from "../InfoTip";

// The explanation is the app's own text (packages/core/src/info/appInfo.ts), shown in the same format.
export interface ProjectionAccuracyInfoModalProps {
  onClose: () => void;
}

function ProjectionAccuracyInfoModal({ onClose }: ProjectionAccuracyInfoModalProps): React.JSX.Element {
  return <InfoWindow info={APP_INFO.c_mo_leer_esta_tabla} onClose={onClose} />;
}

export default ProjectionAccuracyInfoModal;
