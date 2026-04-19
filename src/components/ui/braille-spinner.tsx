"use client";

import spinners, { type BrailleSpinnerName } from "unicode-animations";
import { useEffect, useState } from "react";

interface BrailleSpinnerProps {
  name?: BrailleSpinnerName;
  className?: string;
  children?: React.ReactNode;
}

export function BrailleSpinner({
  name = "helix",
  className,
  children,
}: BrailleSpinnerProps) {
  const { frames, interval } = spinners[name];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setFrame((f) => (f + 1) % frames.length),
      interval,
    );
    return () => clearInterval(timer);
  }, [name]);

  return (
    <span className={className}>
      <span style={{ fontFamily: "monospace" }} aria-hidden="true">
        {frames[frame]}
      </span>
      {children && <span className="ml-2">{children}</span>}
    </span>
  );
}
