import React from "react";
import { Empty } from "antd";

function EmptyModule({ emMessage }) {
  return (
    <div>
      <Empty description={<span className="text-slate-400">{emMessage}</span>} />
    </div>
  );
}

export default EmptyModule;
