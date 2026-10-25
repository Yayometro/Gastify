"use client";

import { useInfo } from "@/i18n/client";
import React from "react";

import { InfoWindow } from "../InfoTip";

// The explanation is the app's own text (packages/core/src/info/appInfo.ts), shown in the same format.
export interface ProjectionsInfoModalProps {
  onClose: () => void;
}

function ProjectionsInfoModal({ onClose }: ProjectionsInfoModalProps): React.JSX.Element {
  const { APP_INFO } = useInfo();
  return <InfoWindow info={APP_INFO.proyecciones} onClose={onClose} />;
}

export default ProjectionsInfoModal;
