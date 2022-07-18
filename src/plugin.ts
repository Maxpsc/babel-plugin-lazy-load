import type * as BabelCoreNamespace from '@babel/core'
import type * as BabelTypesNamespace from '@babel/types'
import template from '@babel/template'
import uniqBy from 'lodash/uniqBy'
import { addChunkNameComment, mergeOptions, toKebabCase } from './utils'

import {
  reactSpecifiersName,
  componentTemplate,
} from './const'
import { entryVisitor } from './visitor'
import { Options } from '.'

export type Babel = typeof BabelCoreNamespace
export type BabelTypes = typeof BabelTypesNamespace
export type ProgramNodePath = BabelCoreNamespace.NodePath<BabelCoreNamespace.types.Program>

export interface PluginState {
  /** Whether need transform */
  needTransform: boolean
  /** All react specifiers after merge */
  reactSpecifier: (
    | BabelCoreNamespace.types.ImportSpecifier
    | BabelCoreNamespace.types.ImportDefaultSpecifier
  )[]
  /** Components' name ready to split */
  compNames: string[]
}

const getInitState = (): PluginState => ({
  needTransform: false,
  reactSpecifier: [],
  compNames: [],
})

/**
 * Plugin Instance
 */
export default class RuiPlugin {
  private state: PluginState
  public types: BabelTypes
  public opts: Required<Options>

  constructor(types: BabelTypes, opts: Options) {
    this.state = getInitState()
    this.types = types
    this.opts = mergeOptions(opts)
  }

  public getState() {
    return this.state
  }

  public updateState<K extends keyof PluginState>(
    key: K,
    payload: PluginState[K] | ((prev: PluginState[K]) => PluginState[K])
  ) {
    if (typeof payload === 'function') {
      this.state[key] = payload(this.state[key])
    } else {
      this.state[key] = payload
    }
  }

  public resetState() {
    this.state = getInitState()
  }

  /** First inspect, determine if need transform */
  public inspect(path: ProgramNodePath) {
    path.traverse(entryVisitor, { plugin: this })
  }

  /** Add all react import in the end */
  public addReactImport(path: ProgramNodePath) {
    const t = this.types
    const { needTransform, reactSpecifier } = this.state
    if (needTransform) {
      const defaultSpecifier = t.importDefaultSpecifier(t.identifier('React'))

      const extraSpecifier = reactSpecifiersName.map((n) => {
        return t.importSpecifier(t.identifier(n), t.identifier(n))
      })

      const uniqSpecifier = uniqBy(reactSpecifier.concat(extraSpecifier), (i) => {
        return i.local.name
      })

      const importDeclaration = t.importDeclaration(
        [defaultSpecifier, ...uniqSpecifier],
        t.stringLiteral('react')
      )
      path.unshiftContainer('body', importDeclaration)
    }
  }

  /** Overwrite AST related to components */
  public overwriteComponents(path: ProgramNodePath) {
    const t = this.types
    const { compNames } = this.state
    const { splitChunkByComp, chunkNames, libraryName, libraryDir: {
      pc: pcLibraryDir,
      mobile: mLibraryDir
    } } = this.opts

    path.traverse({
      ImportDeclaration(path) {
        // last import
        if (!t.isImportDeclaration(path.getNextSibling())) {
          //依次追加components
          compNames.forEach((name) => {
            const getAST = template(componentTemplate, {
              plugins: ['jsx'],
              // 仅可保留表达式外的注释
              preserveComments: true,
            })

            const mName = `M${name}`
            const pcName = `PC${name}`

            // template不支持innerComment，手动添加ast
            const mLibName =
              typeof mLibraryDir === 'function' ? mLibraryDir(toKebabCase(name)) : mLibraryDir
            const mImport = t.callExpression(t.identifier('import'), [
              addChunkNameComment(
                t.stringLiteral(`${libraryName}/${mLibName}`),
                splitChunkByComp ? `${chunkNames.mobile}-${name}` : chunkNames.mobile
              ),
            ])

            const pcLibName =
              typeof pcLibraryDir === 'function' ? pcLibraryDir(toKebabCase(name)) : pcLibraryDir
            const pcImport = t.callExpression(t.identifier('import'), [
              addChunkNameComment(
                t.stringLiteral(`${libraryName}/${pcLibName}`),
                splitChunkByComp ? `${chunkNames.pc}-${name}` : chunkNames.pc
              ),
            ])

            path.insertAfter(
              getAST({
                COMPONENT_NAME: t.identifier(name),
                M_COMP_VAR: t.identifier(mName),
                M_COMP_TAG: t.jsxIdentifier(mName),
                M_IMPORT: mImport,
                PC_COMP_VAR: t.identifier(pcName),
                PC_COMP_TAG: t.jsxIdentifier(pcName),
                PC_IMPORT: pcImport,
              })
            )
          })
        }
      },
    })
  }
}
