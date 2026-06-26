import { useEffect, useRef, type RefObject } from "react";

/**
 * Ferme le contenu (ex. menu) lorsque l’utilisateur clique/touche en dehors de `ref`.
 * Le handler est lu via une ref pour éviter de réattacher les écouteurs à chaque rendu.
 */
export function useOnClickOutside<T extends HTMLElement>(
  handler: () => void,
  enabled: boolean,
): RefObject<T> {
  const ref = useRef<T>(null);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const node = ref.current;
      const target = event.target;
      if (!node || !(target instanceof Node) || node.contains(target)) return;
      handlerRef.current();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [enabled]);

  return ref;
}
