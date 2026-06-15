import { useEffect, useState } from "react";

const PHRASES = ["Login to get started", "Start your work", "Access your records"];

export default function RotatingSubtitle() {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setShow(true);
      }, 350);
    }, 2800);
    return () => clearInterval(cycle);
  }, []);

  return (
    <p className={`mt-2 text-slate-400 transition-all duration-300 ease-out ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
      {PHRASES[index]}
    </p>
  );
}
