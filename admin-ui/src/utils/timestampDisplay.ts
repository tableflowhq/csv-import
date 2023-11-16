const timestampDisplay = (timestamp: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Loosely check if the timestamp is seconds or milliseconds by seeing which is closer to now
  const time = new Date(timestamp).getTime();
  const now = Date.now();
  let adjustedTimestamp = timestamp;
  if (Math.abs(now - time) > Math.abs(now - time * 1000)) {
    adjustedTimestamp = adjustedTimestamp * 1000;
  }
  const date = new Date(adjustedTimestamp);
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hoursMinutes = new Intl.DateTimeFormat("default", { hour12: true, hour: "numeric", minute: "numeric" }).format(date);
  return `${month} ${day}, ${year} ${hoursMinutes}`;
};

export default timestampDisplay;
