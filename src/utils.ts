import type * as BabelCoreNamespace from '@babel/core'
import { Options } from '.'
import { libraryName } from './const'

/** Merge object, src has higher priority */
export function mergeObject<T extends object>(src: T, base: Required<T>): Required<T> {
  return Object.keys(base).reduce((prev, key) => {
    if (!prev[key]) {
      return {
        ...prev,
        [key]: base[key],
      }
    } else if (typeof prev[key] === 'object') {
      return {
        ...prev,
        [key]: mergeObject(prev[key], base[key]),
      }
    } else {
      return prev
    }
  }, src) as Required<T>
}

/** add add leading comment for webpackChunk */
export function addChunkNameComment<T extends BabelCoreNamespace.types.StringLiteral>(node: T, name: string): T {
  // only add leading comment when not found
  if (node.leadingComments) return
  node.leadingComments = [
    {
      type: 'CommentBlock',
      value: ` webpackChunkName: '${name}' `,
    },
  ]
  return node
}

const defaultOptions: Required<Options> = {
  libraryName,
  libraryDir: {
    pc: (name) => `es/components/${name}/pc`,
    mobile: (name) => `es/components/${name}/mobile`,
  },
  chunkNames: {
    pc: 'rui-pc',
    mobile: 'rui-mobile',
  },
  splitChunkByComp: false,
}

/** get real options */
export function mergeOptions(opts: Options = {}): Required<Options> {
  return mergeObject(opts, defaultOptions)
}


export function toKebabCase(str: string) {
  const KEBAB_REGEX = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g
  return str.replace(KEBAB_REGEX, match => match.toLowerCase())
}
