/** Business Information uses locations/ID; v4 reviews need accounts/ID/locations/ID. */
export function googleLocationName(resource: string): string | null {
  const match = resource.match(
    /^(?:accounts\/[A-Za-z0-9_-]+\/)?(locations\/[A-Za-z0-9_-]+)$/,
  );
  return match?.[1] ?? null;
}

export function googleReviewParent(
  resource: string,
  accountName?: string,
): string | null {
  if (/^accounts\/[A-Za-z0-9_-]+\/locations\/[A-Za-z0-9_-]+$/.test(resource)) return resource;
  if (
    /^accounts\/[A-Za-z0-9_-]+$/.test(accountName ?? "") &&
    /^locations\/[A-Za-z0-9_-]+$/.test(resource)
  ) {
    return `${accountName}/${resource}`;
  }
  return null;
}
