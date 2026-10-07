"use client";

import React from "react";
import { Tooltip } from "antd";
import UniversalCategoIcon from "../UniversalCategoIcon";

export interface BasicTooltipStyle {
  tooltip?: string;
  iconSize?: number | string;
  [key: string]: unknown;
}

export interface BasicTooltipProps {
  title?: React.ReactNode;
  content?: React.ReactNode;
  style?: BasicTooltipStyle;
}

function BasicTooltip({ title, content, style }: BasicTooltipProps): React.JSX.Element {
  return (
    <Tooltip title={title} className={style?.tooltip}>
      {content ? (
        content
      ) : (
        <div>
          <UniversalCategoIcon type={`${"fa/FaRegQuestionCircle"}`} siz={style?.iconSize || 20} />
        </div>
      )}
    </Tooltip>
  );
}

export default BasicTooltip;
