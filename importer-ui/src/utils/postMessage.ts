function postMessage(message: any) {
  if (window?.top?.postMessage) {
    window.top.postMessage(message, "*");
  } else {
    window?.parent?.postMessage(message, "*");
  }
}

export default postMessage;
