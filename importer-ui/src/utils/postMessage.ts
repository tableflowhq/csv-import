function postMessage(message: any) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const finalMessage = { ...message, id, source: "tableflow-importer" };
  if (window?.top?.postMessage) window.top.postMessage(finalMessage, "*");
  if (window?.parent?.postMessage) window.parent.postMessage(finalMessage, "*");
}

export default postMessage;
