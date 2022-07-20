import type * as BabelCoreNamespace from '@babel/core'
import type * as BabelTypesNamespace from '@babel/types'
import * as t from '@babel/types'
import Plugin from './plugin'
import { ruiSpecifiersName, ruiExtraSpecifier } from './const'

export type Babel = typeof BabelCoreNamespace
export type BabelTypes = typeof BabelTypesNamespace
export type ImportSpecifier = BabelCoreNamespace.types.ImportSpecifier

export interface VisitorState {
  plugin: Plugin
}

const innerVisitor: BabelCoreNamespace.Visitor<VisitorState> = {
  ImportDeclaration(path, state) {
    const { plugin } = state
    if (!plugin) return

    const {
      opts: { libraryName },
    } = plugin
    // deal react.suspense & lazy
    if (t.isStringLiteral(path.node.source, { value: 'react' })) {
      path.node.specifiers.forEach((i) => {
        // if reactSpecifier already exists, ignore
        if (i.type === 'ImportSpecifier') {
          plugin.updateState('reactSpecifier', (prev) =>
            prev.concat(
              t.importSpecifier(t.identifier(i.local.name), t.identifier((i.imported as any).name))
            )
          )
        }
      })
      path.remove()
      return
    }

    // deal target library
    if (t.isStringLiteral(path.node.source, { value: libraryName })) {      
			path.traverse({
				ImportSpecifier(path) {
          const siblings = (path.container as object[]).filter((i) => t.isImportSpecifier(i))
          // add useMobile if necessary
          if (!siblings.find((i: any) => i.imported?.name === ruiExtraSpecifier)) {
            path.insertAfter(
              t.importSpecifier(t.identifier(ruiExtraSpecifier), t.identifier(ruiExtraSpecifier))
            )
          }

          if (!ruiSpecifiersName.includes((path.node.imported as any).name)) {
            plugin.updateState('compNames', (prev) => prev.concat((path.node.imported as any).name))
            path.remove()
          }
        }
			})
    }
  },
}

export const entryVisitor: BabelCoreNamespace.Visitor<VisitorState> = {
  ImportDeclaration(path, state) {
    const { plugin } = state
    if (!plugin) return

    const {
      opts: { libraryName },
    } = plugin
    
    if (t.isStringLiteral(path.node.source, { value: libraryName })) {
      if (
        path.node.specifiers
          .filter((i) => t.isImportSpecifier(i))
          .find((i: ImportSpecifier) => !ruiSpecifiersName.includes((i.imported as any).name))
      ) {
        console.log('lazy-load needTransform:', true)
				plugin.updateState('needTransform', true)
        // path.stop()
        path
          .findParent((path) => path.isProgram())
          .traverse(innerVisitor, {
            plugin,
          })
        return
			}
    }
  },
}
