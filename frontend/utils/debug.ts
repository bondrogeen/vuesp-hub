const debug = process.env.NODE_ENV === 'development';

export const log = (...arg: any) => {
  if (!debug) return;
  console.log(arg);
};
