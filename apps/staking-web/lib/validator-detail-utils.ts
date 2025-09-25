export function getValidatorDisplayName(validator: {
  validatorId: string;
  meta?: { name?: string };
}): string {
  return validator.meta?.name ?? `Validator ${validator.validatorId}`;
}

export function hasValidatorMetadata(validator: {
  meta?: { name?: string; website?: string; description?: string };
}): boolean {
  return !!(validator.meta?.name || validator.meta?.website || validator.meta?.description);
}
