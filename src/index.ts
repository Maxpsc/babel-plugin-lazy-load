import { declare } from '@babel/helper-plugin-utils'
import Plugin from './plugin'
import { Babel, PluginObj } from './interface'

type LibraryDirType = string | ((compName: string) => string)

export interface Options {
  /** 默认@ad/r-ui */
  libraryName?: string
  /** 拆分chunk的名字 */
  chunkNames?: {
    /** pc端chunk名，默认rui-pc */
    pc?: string
    /** 移动端chunk名，默认rui-mobile */
    mobile?: string
  }
  /** 对应端目录 */
  libraryDir?: {
    pc?: LibraryDirType
    mobile?: LibraryDirType
  }
  /** 组件有各自的chunk，默认false，即合并到两端各自的chunk中 */
  splitChunkByComp?: boolean
}

/**
 * 双端组件babel插件
 * 1. import React from 'react' => import React, { suspense, lazy } from 'react'
 * 2. import { useMobile, Button } from '@ad/r-ui' => import { useMobile } from '@ad/r-ui'
 * 3. 组件重新封装
 */
export default declare(function ruiPlugin(babel: Babel): PluginObj {
  const { types: t, assertVersion } = babel
  assertVersion(7)

  let globalPlugin: Plugin = null

  return {
    name: 'lazy-load',
    visitor: {
      Program: {
        enter(path, state) {
          console.log(555)
          globalPlugin = new Plugin(t, state.opts as Options)
          globalPlugin.inspect(path)
        },
        exit() {
          if (!globalPlugin) return
          globalPlugin.resetState()
        },
      },
    },
    post() {
      globalPlugin = null
    },
  }
})
