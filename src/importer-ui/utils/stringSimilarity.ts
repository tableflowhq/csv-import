export default function stringsSimilarity(s1: string, s2: string): number {
  const words = s1.split(" ");
  const words2 = s2.split(" ");

  const highestSimilarity = words.reduce((acc, word) => {
    const highestSimilarity = words2.reduce((acc2, word2) => {
      const wordSimilarity = similarity(word, word2);
      return wordSimilarity > acc2 ? wordSimilarity : acc2;
    }, 0);

    return highestSimilarity > acc ? highestSimilarity : acc;
  }, 0);

  return highestSimilarity;
}

// From https://stackoverflow.com/a/36566052

function similarity(s1: string, s2: string): number {
  let longer: string = s1;
  let shorter: string = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength: number = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString());
}

function editDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs: number[] = new Array(s2.length + 1);
  for (let i = 0; i <= s1.length; i++) {
    let lastValue: number = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue: number = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
