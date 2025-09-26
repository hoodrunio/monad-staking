export function getValidatorDisplayName(validator: {
  id: string;
  meta?: { name?: string };
}): string {
  return validator.meta?.name ?? `Validator ${validator.id}`;
}

export function hasValidatorMetadata(validator: {
  meta?: { name?: string; website?: string; description?: string };
}): boolean {
  return !!(validator.meta?.name || validator.meta?.website || validator.meta?.description);
}
