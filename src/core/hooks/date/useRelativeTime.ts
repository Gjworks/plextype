import { useState, useEffect } from "react";
import { formatKstRelative } from "@/core/utils/date/kst";

const useRelativeTime = (date: string) => {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    if (date) {
      setTimeAgo(formatKstRelative(date));
    }
  }, [date]);

  return timeAgo;
};

export default useRelativeTime;
