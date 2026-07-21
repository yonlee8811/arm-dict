import { Dict } from './dict';
// バンドル同梱の辞書データを require で読み込む（起動時に一度だけ評価される）。
// 1,898語・約1.1MB。オフラインで全文検索できる。
const data = require('../assets/dictionary.json') as Dict;

export function useDict(): Dict {
  return data;
}

export const DICT: Dict = data;
