import { useEffect, useState } from "react";

// False on the server and on the first client render, true once React has
// hydrated the page. Used to keep forms disabled until then: anything typed
// into a controlled input BEFORE hydration is wiped when React takes over (bug
// 160), and an early click on submit would send the form as a plain GET with
// the fields (password included) in the URL.
export default function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState<boolean>(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
