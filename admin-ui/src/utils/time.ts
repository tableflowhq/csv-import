import padNum from "./padNum";

export function timeToText(timestamp: number, getFullTime = false, isUnix = true): string {
  const num = isUnix ? timestamp * 1000 : timestamp,
    elapsed = Date.now() - num,
    msPerMinute = 60 * 1000,
    msPerHour = msPerMinute * 60,
    msPerDay = msPerHour * 24;

  if (!getFullTime) {
    if (elapsed < msPerMinute) {
      // const seconds = Math.round(elapsed / 1000);
      return "Just Now";
    } else if (elapsed < msPerHour - msPerMinute) {
      const minutes = Math.round(elapsed / msPerMinute);
      return minutes === 1 ? minutes + " minute ago" : minutes + " minutes ago";
    } else if (elapsed < msPerDay - msPerHour) {
      const hours = Math.round(elapsed / msPerHour);
      return hours === 1 ? hours + " hour ago" : hours + " hours ago";
    } else if (elapsed < msPerDay * 10) {
      const days = Math.round(elapsed / msPerDay);
      return days === 1 ? days + " day ago" : days + " days ago";
    }
  }

  const date = new Date(num),
    month = date.getMonth() + 1,
    day = date.getDate(),
    year = date.getFullYear(),
    rawHours = date.getHours(),
    hours = padNum(rawHours % 12 ? rawHours : 12, 2),
    minutes = padNum(date.getMinutes(), 2),
    seconds = padNum(date.getSeconds(), 2),
    ext = rawHours >= 12 ? "PM" : "AM";

  // Formatted like: 11/24/2021 9:32:12 AM
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ext}`;
}
