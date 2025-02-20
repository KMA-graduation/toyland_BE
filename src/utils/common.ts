import {
  compact,
  find,
  forEach,
  isEmpty,
  keyBy,
  map,
  reduce,
  uniq,
} from 'lodash';

export const VND_TO_USD = 25000;

export const convertToSlug = function (url: string) {
  url = url.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  url = url.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  url = url.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  url = url.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  url = url.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  url = url.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  url = url.replace(/đ/g, 'd');
  url = url.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'a');
  url = url.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'e');
  url = url.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'i');
  url = url.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'o');
  url = url.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'u');
  url = url.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'y');
  url = url.replace(/Đ/g, 'd');

  url = url.replace(
    /[^0-9a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/gi,
    '',
  );
  const cloneArray = url.toLowerCase().split(' ');

  const reWrite = [];

  for (let item of cloneArray) {
    if (item !== '') reWrite.push(item);
  }

  return reWrite.join('-');
};

export enum IsGetAll {
  No,
  Yes,
}

export const escapeCharForSearch = (str: string): string => {
  return str.toLowerCase().replace(/[?%\\_]/gi, function (x) {
    return '\\' + x;
  });
};

export const getKeyByObject = (data: Record<string, any>, keyInput: string) => {
  const matchedValues: any[] = [];

  if (data[keyInput]) {
    matchedValues.push(data[keyInput]);
  }

  function traverse(obj: Record<string, any>) {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverse(obj[key]);
      } else if (key === keyInput) {
        matchedValues.push(obj[key]);
      }
    }
  }

  traverse(data);
  return uniq(compact(matchedValues));
};

export function sumByKeys(
  objArr: any[],
  options: {
    keys: string[];
    quantityFields: string[];
    isKeyBy?: boolean;
  },
): any {
  const { keys, quantityFields, isKeyBy } = options;
  const result = reduce(
    objArr,
    (result, i) => {
      const key = map(keys, (key) => {
        return i[key];
      }).join('-');

      i['key'] = key;
      const existing = find(result, (j) => {
        return j['key'] === i['key'];
      });

      if (isEmpty(existing)) {
        result.push({ ...i, key });
      } else {
        forEach(quantityFields, (q) => {
          existing[q] = (i[q] | 0) + (existing[q] | 0);
        });
      }
      return result;
    },
    [],
  );

  return isKeyBy ? keyBy(result, 'key') : result;
}
