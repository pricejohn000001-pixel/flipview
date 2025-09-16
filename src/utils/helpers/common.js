/* eslint-disable no-bitwise */
// Common Utilities
export const _noop = () => { };
export const _identity = item => item;
export const _flow = (...funcsToExec) => arg => funcsToExec.reduce((result, funcToExec) => funcToExec(result), arg);
export { v4 as _uuid } from 'uuid';
export const _tail = (array, defaultReturn = undefined) => (!_isArray(array) || array.length === 0) ? defaultReturn : array[array.length - 1];
export const _head = (variable, defaultReturn = undefined) => {
  let arrayLike = variable;
  if (_isObjectLike(variable)) arrayLike = Object.keys(variable).map(key => variable[key]);
  return (_isNil(arrayLike) || arrayLike.length === 0) ? defaultReturn : arrayLike[0];
};
export const _isEqual = (firstValue, secondValue) => JSON.stringify(firstValue) === JSON.stringify(secondValue);
export const _isEmpty = arrayOrObject => _size(arrayOrObject) === 0;
export const _size = arrayOrObject => (arrayOrObject) ? (_isArray(arrayOrObject) ? arrayOrObject : Object.keys(arrayOrObject)).length : 0;
export const _keyBy = (array, key) => _isArray(array) ? array.reduce((acc, item) => item[key] ? ({ ...acc, [item[key]]: item }) : acc, {}) : {};
export const _max = (...args) => args.reduce((maxTillNow, currentArg) => currentArg > maxTillNow ? currentArg : maxTillNow, args[0]);

export const _debounce = (funcToExec, millisToDebounce) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => { funcToExec(...args); }, millisToDebounce);
  };
};
export const _shouldIgnoreGlobalImplementations = () => window.location.pathname.endsWith('broadcast');
export const _uniqBy = (array, uniqueByGetter) => {
  const uniqueSet = new Set();
  return array.reduce((acc, item) => {
    if (uniqueSet.has(uniqueByGetter(item))) return acc;
    uniqueSet.add(uniqueByGetter(item));
    return [...acc, item];
  }, []);
};

// Type Checking
export const _isString = item => typeof item === 'string';
export const _isArray = variable => variable instanceof Array;
export const _isNil = variable => variable === undefined || variable === null;
export const _isObjectLike = variable => !_isNil(variable) && Object.getPrototypeOf(variable) === Object.prototype;
export const _isFunction = variable => typeof variable === 'function';

export const _hashRGB = (str) => {
  const stringHash = str.split('').reduce((acc, char) => {
    const hash = (acc + char.charCodeAt(0) + (acc << 5 - acc));
    return hash & hash;
  }, 0);
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (stringHash >> (i * 8)) & 255;
    color += (`00${value.toString(16)}`).substr(-2);
  }
  return color;
};

export const UTCToLocalTime = time => new Date(time);
export const localTimeToUTC = time => time.utc().format('YYYY-MM-DD HH:mm:ss');

export const _getHexCode = (network) => {
  switch (network) {
    case 'Women\'s Network+':
      return '#84329B';
    case 'Veterans Network+':
      return '#3E8529';
    case 'Hispanic Network+':
      return '#D76B00';
    case 'African American Network+':
      return '#58A7AF';
    case 'People With Disabilities Network+':
      return '#34657F';
    case 'Native American Network+':
      return '#94795D';
    case 'Lesbian, Gay, Bisexual, Transgender+ Network (LGBT+ Network)':
      return '#94969A';
    case 'Asian Professional Engagement Network+':
      return '#C63527';
    case 'EVENT STAFF':
      return '#FBC600';
    default:
      return '#3B3C43';
  }
};

export const _validateTextLength = (lengths, value) => {
  const textLength = value.length;
  if (lengths.length > 2) console.error('Size array should have a maximum of two elements');
  if (lengths.length === 2 && lengths[0] === undefined) return textLength <= lengths[1];
  if (lengths.length >= 2) return textLength >= lengths[0] && textLength <= lengths[1];
  if (lengths.length === 1) return textLength <= lengths[0];
  if (lengths.length === 0) return true;
  return false;
};

export const _validatePattern = (pattern, value) => pattern.test(value);

export const ERROR_TEXT = 'Something went wrong while fetching the content. Please try again or try reloading the page';
