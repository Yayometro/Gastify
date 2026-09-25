import React from "react";

export interface TagItem {
  _id?: string;
  name?: string;
  color?: string;
  [key: string]: unknown;
}

export interface TagProps {
  tag?: TagItem | null;
  size?: number | string;
}

function Tag({ tag, size }: TagProps): React.JSX.Element {
  return tag ? (
    <div
      className={`leading-nonerounded-full px-1 py-0 text-center flex items-center border rounded-full h-full hover:mix-blend-multiply`}
      style={{ 
        backgroundColor: tag.color || "#DADADA" ,
        fontSize: size + "px",
        lineHeight: 'normal'
      }}
    >
      {tag.name}
    </div>
  ) : (
    <p>No tag...</p>
  );
}

export default Tag;
