function postMessage(message: any) {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);

  if (window?.top?.postMessage) window.top.postMessage({ ...message, id }, "*");
  if (window?.parent?.postMessage) window.parent.postMessage({ ...message, id }, "*");
}

export default postMessage;
