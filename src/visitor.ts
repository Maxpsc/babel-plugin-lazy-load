import type * as BabelCoreNamespace from '@babel/core'
import * as t from '@babel/types'
import uniqBy from 'lodash/uniqBy'
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
      updateState
    } = plugin

    // deal react.suspense & lazy
    if (t.isStringLiteral(path.node.source, { value: 'react' })) {
      const specifiers = path.node.specifiers.map((i) => i.local.name)
      // 已包含/执行过，跳过
      if (
        specifiers.filter((i) => reactSpecifiersName.includes(i)).length ===
          reactSpecifiersName.length || getState().reactTransformed
      ) {
        return
      }

      const extraSpecifier = reactSpecifiersName.map((n) => {
        return t.importSpecifier(t.identifier(n), t.identifier(n))
      })
      const uniqSpecifier = uniqBy(path.node.specifiers.concat(extraSpecifier), (i) => {
        return i.local.name
      })

      path.replaceWith(t.importDeclaration(uniqSpecifier, t.stringLiteral('react')))
      updateState('reactTransformed', true)
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

          // 支持动态加载的组件，从原来的引用中删除，同时追加组件名
          if (!ruiSpecifiersName.includes((path.node.imported as any).name)) {
            const compName = (path.node.imported as any).name
            plugin.updateState('compNames', (prev) => prev.concat((path.node.imported as any).name))
            path.remove()
          }
        }
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
        console.log('lazy-load needTransform:', true)

        plugin.updateState('needTransform', true)
        path
          .findParent((path) => path.isProgram())
          .traverse(innerVisitor, {
            plugin,
          })
			}
    }
  },
}
