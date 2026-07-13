"use client";

import { useEffect } from "react";
import { usePrototypeStore } from "@/store/prototype-store";

export function StoreHydrator() {
  useEffect(() => {
    void usePrototypeStore.persist.rehydrate();
  }, []);

  return null;
}
