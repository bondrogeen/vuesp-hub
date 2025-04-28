const debug = process.env.NODE_ENV === 'development';

const log = (...arg) => {
  if (!debug) return;
  console.log(arg);
};

export default log;
