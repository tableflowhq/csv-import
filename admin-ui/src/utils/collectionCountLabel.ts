export default function collectionCountLabel(
  none: string,
  singular: string,
  plural: string,
  total: number,
  notFound?: string,
  foundIn?: string,
  partial?: number
) {
  return !total
    ? none
    : partial !== undefined && partial < total
    ? `${partial || notFound} ${foundIn} ${total}`
    : total === 1
    ? `${total} ${singular}`
    : `${total} ${plural}`;
}
