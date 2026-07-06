"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategoryPack } from "@/lib/taxonomy/category-packs";
import {
  getVerticalLabel,
  VERTICAL_ORDER,
} from "@/lib/taxonomy/verticals";

export type BusinessCategoryOption = {
  slug: string;
  name: string;
  vertical: string;
  description: string;
};

export function BusinessCategorySelect({
  categories,
  value,
  onValueChange,
}: {
  categories: BusinessCategoryOption[];
  value: string;
  onValueChange: (slug: string) => void;
}) {
  const selected = categories.find((category) => category.slug === value);
  const pack = getCategoryPack(value);

  const grouped = VERTICAL_ORDER.map((vertical) => ({
    vertical,
    label: getVerticalLabel(vertical),
    items: categories.filter((category) => category.vertical === vertical),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={(next) => next && onValueChange(next)}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {grouped.map((group) => (
            <SelectGroup key={group.vertical}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.items.map((category) => (
                <SelectItem key={category.slug} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      {selected ? (
        <div className="rounded-xl border bg-muted/30 px-3 py-2.5 text-sm">
          <p className="text-muted-foreground">{selected.description}</p>
          {pack && pack.defaultServiceSlugs.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              We&apos;ll pre-load{" "}
              <span className="font-medium text-foreground">
                {pack.defaultServiceSlugs.length} services
              </span>
              {pack.descriptionTemplate
                ? " and a starter business description"
                : ""}{" "}
              — all editable after setup.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
