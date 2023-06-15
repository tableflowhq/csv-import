const timestampDisplay = (timestamp: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const date = new Date(timestamp);
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${month} ${day}, ${year} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

export default timestampDisplay;
