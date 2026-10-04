import {pathToFileURL} from 'node:url';
import {resolve as pathResolve} from 'node:path';
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'three') return {url:pathToFileURL(pathResolve('dist/vendor/three.module.js')).href,shortCircuit:true};
  return nextResolve(specifier, context);
}
