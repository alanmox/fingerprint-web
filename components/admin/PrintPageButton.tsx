"use client";

import { Button } from "@/components/Button";

export function PrintPageButton() {
  return (
    <Button onClick={() => window.print()} type="button">
      Print
    </Button>
  );
}
