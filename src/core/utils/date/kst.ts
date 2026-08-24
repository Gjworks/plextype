import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ko";

export const KST_TIME_ZONE = "Asia/Seoul";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko");

export const toKstDayjs = (date: Date | string | number | null | undefined) => {
  if (!date) return null;
  return dayjs(date).tz(KST_TIME_ZONE);
};

export const formatKstRelative = (date: Date | string | number | null | undefined) => {
  const kstDate = toKstDayjs(date);
  return kstDate ? kstDate.fromNow() : "-";
};

export const formatKstDateTime = (date: Date | string | number | null | undefined) => {
  const kstDate = toKstDayjs(date);
  return kstDate ? kstDate.format("YYYY. MM. DD. A hh:mm") : "-";
};

export const formatKstShortDateTime = (date: Date | string | number | null | undefined) => {
  const kstDate = toKstDayjs(date);
  return kstDate ? kstDate.format("MM. DD. A hh:mm") : "-";
};

export const formatKstTime = (date: Date | string | number | null | undefined) => {
  const kstDate = toKstDayjs(date);
  return kstDate ? kstDate.format("A h:mm") : "-";
};

export const formatKstDate = (date: Date | string | number | null | undefined) => {
  const kstDate = toKstDayjs(date);
  return kstDate ? kstDate.format("YYYY. MM. DD.") : "-";
};

export const getKstDayGroup = (date: Date | string | number | null | undefined) => {
  const kstDate = toKstDayjs(date);
  if (!kstDate) return "이전";

  const today = dayjs().tz(KST_TIME_ZONE);
  const yesterday = today.subtract(1, "day");

  if (kstDate.isSame(today, "day")) return "오늘";
  if (kstDate.isSame(yesterday, "day")) return "어제";
  return "이전";
};
