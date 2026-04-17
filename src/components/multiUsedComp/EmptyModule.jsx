import React from "react";
import { Empty } from "antd";

function EmptyModule({ emMessage }) {
  return (
    <>
      <Empty description={<span className="text-slate-400">{emMessage}</span>} />
    </>
  );
}

export default EmptyModule;
