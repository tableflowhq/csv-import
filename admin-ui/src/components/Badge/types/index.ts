export type BadgeVariant = "neutral" | "highlight" | "success" | "deep" | "circle";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
    variants?: BadgeVariant[];
};

export const badgeVariants: BadgeVariant[] = ["neutral", "highlight", "success", "deep", "circle"];
