
import chalk from 'chalk'
import template from '@babel/template'
import { addChunkNameComment, mergeOptions, toKebabCase } from './utils'
import { componentTemplate, ruiExtraSpecifier } from './const'
import { entryVisitor } from './visitor'
import { Options } from '.'
import { BabelTypes, ProgramNodePath } from './interface'

export interface SpecifierInfo {
  /** origin import */
  importName: string
  /** local alias */
  localName: string
}

export interface PluginState {
  /** All react specifiers after merge */
  reactTransformed: boolean
  reactSpecifiers: SpecifierInfo[]
  /** Components' name ready to split */
  compNames: SpecifierInfo[]
}

const getInitState = (): PluginState => ({
  reactTransformed: false,
  reactSpecifiers: [],
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

    this.getState = this.getState.bind(this)
    this.updateState = this.updateState.bind(this)
    this.bootstrap = this.bootstrap.bind(this)
    this.resetState = this.resetState.bind(this)
    this.overwriteComponents = this.overwriteComponents.bind(this)
    this.log = this.log.bind(this)
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

  public bootstrap(path: ProgramNodePath) {
    path.traverse(entryVisitor, { plugin: this })
  }

  /** Overwrite AST related to components by compNames */
  public overwriteComponents(path: ProgramNodePath) {
    const t = this.types
    const { compNames } = this.state
    const log = this.log
    const {
      splitChunkByComp,
      chunkNames,
      libraryName,
      libraryDir: { pc: pcLibraryDir, mobile: mLibraryDir },
    } = this.opts

    path.traverse({
      ImportDeclaration(path) {
        // last importDeclaration
        if (!t.isImportDeclaration(path.getNextSibling())) {
          compNames.forEach(({ importName, localName }) => {
            const getAST = template(componentTemplate, {
              plugins: ['jsx'],
              // 仅可保留表达式外的注释
              preserveComments: true,
            })

            // template不支持innerComment，手动添加ast
            const mLibName =
              typeof mLibraryDir === 'function'
                ? mLibraryDir(toKebabCase(importName))
                : mLibraryDir
            const mImport = t.callExpression(t.identifier('import'), [
              addChunkNameComment(
                t.stringLiteral(`${libraryName}/${mLibName}`),
                splitChunkByComp ? `${chunkNames.mobile}-${importName}` : chunkNames.mobile
              ),
            ])

            const pcLibName =
              typeof pcLibraryDir === 'function'
                ? pcLibraryDir(toKebabCase(importName))
                : pcLibraryDir
            const pcImport = t.callExpression(t.identifier('import'), [
              addChunkNameComment(
                t.stringLiteral(`${libraryName}/${pcLibName}`),
                splitChunkByComp ? `${chunkNames.pc}-${importName}` : chunkNames.pc
              ),
            ])

            path.insertAfter(
              getAST({
                USE_MOBILE: t.callExpression(t.identifier(ruiExtraSpecifier), []),
                COMPONENT_NAME: t.identifier(localName),
                M_IMPORT: mImport,
                PC_IMPORT: pcImport,
              })
            )

            log(`overwrite component: ${chalk.green(localName)} as ${chalk.blue(importName)}`)
          })
        }
      },
    })
  }

  public log(...args: any) {
    const { verbose } = this.opts
    if (verbose) {
      console.log(chalk.green('[plugin-lazy-load]'), ...args)
    }
  }
}
