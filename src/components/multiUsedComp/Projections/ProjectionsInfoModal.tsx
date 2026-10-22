"use client";

import React from "react";
import { APP_INFO } from "@gastify/core/info/appInfo";
import { InfoWindow } from "../InfoTip";

// The explanation is the app's own text (packages/core/src/info/appInfo.ts), shown in the same format.
export interface ProjectionsInfoModalProps {
  onClose: () => void;
}

function ProjectionsInfoModal({ onClose }: ProjectionsInfoModalProps): React.JSX.Element {
  return <InfoWindow info={APP_INFO.proyecciones} onClose={onClose} />;
}

export default ProjectionsInfoModal;
