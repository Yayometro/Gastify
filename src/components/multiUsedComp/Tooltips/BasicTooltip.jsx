"use client"
import { Tooltip } from "antd";
import UniversalCategoIcon from "../UniversalCategoIcon";

function BasicTooltip({ title, content, style }) {
  return (
    <Tooltip title={title} className={style?.tooltip}>
      {content ? (
        content
      ) : (
        <div>
          <UniversalCategoIcon type={`${"fa/FaRegQuestionCircle"}`} siz={style?.iconZise || 20} />
        </div>
      )}
    </Tooltip>
  );
}

export default BasicTooltip;
