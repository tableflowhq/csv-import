function debounce<F extends (...args: any[]) => any>(func: F, wait: number, immediate = false): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function executedFunction(this: any, ...args: Parameters<F>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context: any = this;

    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

export default debounce;
