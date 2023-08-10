function postMessage(message: string) {
  if (window?.parent?.postMessage) {
    window.parent.postMessage(message, "*");
  } else {
    window?.top?.postMessage(message, "*");
  }
}

export default postMessage;
