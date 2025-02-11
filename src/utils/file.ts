import * as fs from 'fs';

export const unlink = (filePath, silent = true) => {
  let r = null;
  let callback = (error) => {
    if (error) {
      console.log(`unlink path: ${filePath} failed.`, error);
    }
  };
  if (!silent) {
    r = new Promise((rs, rj) => {
      callback = (error) => {
        if (error) {
          return rj(error);
        }
        return rs(true);
      };
    });
  }

  fs.unlink(filePath, callback);

  return r;
};
