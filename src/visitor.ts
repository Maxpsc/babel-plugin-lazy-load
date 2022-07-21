import type * as BabelCoreNamespace from '@babel/core'
import * as t from '@babel/types'
import difference from 'lodash/difference'
import Plugin from './plugin'
import { ruiSpecifiersName, ruiExtraSpecifier, reactSpecifiersName } from './const'
import { ImportSpecifier, ProgramNodePath } from './interface'

export interface VisitorState {
  plugin: Plugin
}

// 确认要转换
const innerVisitor: BabelCoreNamespace.Visitor<VisitorState> = {
  ImportDeclaration(path, state) {
    const { plugin } = state
    if (!plugin) return

    const {
      opts: { libraryName },
      getState,
      updateState,
    } = plugin

    // insert extra react Specifiers after last import
    if (!t.isImportDeclaration(path.getNextSibling()) && !getState().reactTransformed) {
      const extraSpecifiers = difference(reactSpecifiersName, getState().reactSpecifiers)

      if (extraSpecifiers.length) {
        path.insertAfter(
          t.importDeclaration(
            extraSpecifiers.map((n) => {
              return t.importSpecifier(t.identifier(n), t.identifier(n))
            }),
            t.stringLiteral('react')
          )
        )
        updateState('reactTransformed', true)
      }
    }

    // collect react specifiers
    if (t.isStringLiteral(path.node.source, { value: 'react' }) && !getState().reactTransformed) {
      const specifiers = path.node.specifiers.map((i) => i.local.name)
      updateState('reactSpecifiers', (prev) => prev.concat(specifiers))
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

          // 支持动态加载的组件，从原来的引用中删除，同时追加组件名
          if (!ruiSpecifiersName.includes((path.node.imported as any).name)) {
            plugin.updateState('compNames', (prev) => prev.concat((path.node.imported as any).name))
            path.remove()
          }
        },
      })

      plugin.overwriteComponents(path.findParent((i) => i.isProgram()) as ProgramNodePath)
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
        path
          .findParent((path) => path.isProgram())
          .traverse(innerVisitor, {
            plugin,
          })
			}
    }
  },
}
