/* eslint-disable */
// @ts-ignore
import uglify from 'uglify-js';

export function muglify(code: string): string {
  const minifyOutput = uglify.minify(code);

  if (minifyOutput.error) {
    throw minifyOutput.error;
  }

  return minifyOutput.code + ' // MUGLIFIED';
}
