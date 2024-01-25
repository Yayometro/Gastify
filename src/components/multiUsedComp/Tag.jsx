import React from "react";

function Tag({ tag, size }) {
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
