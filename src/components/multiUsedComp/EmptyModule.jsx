import React from "react";
import { Empty } from "antd";

function EmptyModule({ emMessage }) {
  return (
    <>
      <Empty description={<span className="text-gf-text-muted">{emMessage}</span>} />
    </>
  );
}

export default EmptyModule;
