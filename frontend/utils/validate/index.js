export const validateIP = ip => /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);

export const min = (min, v) => v.length >= min;
export const max = (max, v) => v.length <= max;

export const rules = {
    required: value => !!value || 'Required.',
    sameAs: (value1, value) => value1 === value || 'Passwords do not match',
    ip: v => validateIP(v) || 'Invalid ip address',
    min: v => min(8, v) || 'Min 8 characters',
    max: v => max(32, v) || 'Max 32 characters',
    max12: v => max(12, v) || 'Max 12 characters',
    isPort: v => (typeof +v === 'number' && !isNaN(+v) && +v < 65536) || 'Invalid port',
};
