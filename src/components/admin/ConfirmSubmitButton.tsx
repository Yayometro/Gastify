"use client";

import React from "react";

// A submit button that asks for confirmation first. Used for the admin actions that change an account.
export default function ConfirmSubmitButton({ message, children }: { message: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className="gf-glass-button-danger rounded-full px-5 py-2 text-sm font-semibold text-white"
    >
      {children}
    </button>
  );
}
