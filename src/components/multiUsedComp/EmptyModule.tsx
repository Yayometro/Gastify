import React from "react";
import { Empty } from "antd";

export interface EmptyModuleProps {
  emMessage?: React.ReactNode;
}

function EmptyModule({ emMessage }: EmptyModuleProps): React.JSX.Element {
  return (
    <>
      <Empty description={<span className="text-gf-text-muted">{emMessage}</span>} />
    </>
  );
}

export default EmptyModule;
