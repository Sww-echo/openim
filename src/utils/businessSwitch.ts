export type BusinessSwitchValue = boolean | number | null | undefined;

export const hasBusinessSwitchValue = (value: BusinessSwitchValue) =>
  value !== undefined && value !== null;

export const isBusinessSwitchOn = (
  value: BusinessSwitchValue,
  fallback: boolean,
) => {
  if (!hasBusinessSwitchValue(value)) {
    return fallback;
  }

  return value === true || Number(value) === 1;
};
