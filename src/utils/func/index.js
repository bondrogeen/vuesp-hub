export const toByte = value => {
  const sizes = ['B', 'KB', 'MB'];
  if (value == 0) return '0 B';
  let i = parseInt(Math.floor(Math.log(value) / Math.log(1024)));
  if (i > 1) i = 1;
  return Math.round(value / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

export const dateUtcToString = (unixTime, options = { year: 'numeric', month: 'numeric', day: 'numeric', }, location = []) => {
  const localDate = new Date(unixTime);
  return localDate.toLocaleDateString(location, options)
}

export const timeUtcToString = (unixTime, options = { second: '2-digit', minute: '2-digit', hour: '2-digit', timeZone: 'UTC' }, location = []) => {
  const localDate = new Date(unixTime);
  return localDate.toLocaleTimeString(location, options);
};

const addZero = (value) => value >= 10 ? value : `0${value}`

export const secToTime = (seconds) => {
  // let y = Math.floor(seconds / 31536000);
  // let mo = Math.floor((seconds % 31536000) / 2628000);
  let d = Math.floor(((seconds % 31536000) % 2628000) / 86400);
  let h = Math.floor((seconds % (3600 * 24)) / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = Math.floor(seconds % 60);
  return `${d ? d + ' days ' : ''} ${addZero(h)}:${addZero(m)}:${addZero(s)}`
};

export const debounce = function (func, wait, immediate) {
  let timeout;
  return function executedFunction() {
    const context = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

