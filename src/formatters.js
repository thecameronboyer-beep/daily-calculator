export function formatNumber(value, options = {}) {
  const {
    maximumFractionDigits = 2,
    minimumFractionDigits = 0,
    suffix = '',
    prefix = '',
  } = options;

  if (!Number.isFinite(value)) {
    return '-';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);

  return `${prefix}${formatted}${suffix}`;
}
