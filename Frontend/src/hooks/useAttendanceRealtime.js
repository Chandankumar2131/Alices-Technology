import { useEffect } from "react";
import { getSocket } from "../lib/socket";

const getId = (value) => String(value?._id || value?.id || value || "");

export function useAttendanceRealtime(onUpdate, options = {}) {
  const { employeeId, fallbackMs = 60000 } = options;

  useEffect(() => {
    if (typeof onUpdate !== "function") return undefined;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleUpdate = (event = {}) => {
      if (employeeId && getId(event.employeeId) !== getId(employeeId)) return;
      onUpdate(event);
    };

    socket.on("attendance:updated", handleUpdate);

    const intervalId =
      fallbackMs > 0 ? window.setInterval(() => onUpdate({ type: "fallback" }), fallbackMs) : null;

    return () => {
      socket.off("attendance:updated", handleUpdate);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [onUpdate, employeeId, fallbackMs]);
}
