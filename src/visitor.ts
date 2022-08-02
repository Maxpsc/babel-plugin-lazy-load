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
      opts: { libraryName, verbose },
      log,
      getState,
      updateState,
    } = plugin

    // insert extra react Specifiers after last import
    if (!t.isImportDeclaration(path.getNextSibling()) && !getState().reactTransformed) {
      const extraSpecifiers = difference(reactSpecifiersName, getState().reactSpecifiers.map(i => i.importName))

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
      const specifiers = path.node.specifiers.map((i) => {
        return {
          importName: (i as any)?.imported?.name,
          localName: i.local.name,
        }
      })
      
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

          const importedName = (path.node.imported as any).name
          const localName = (path.node.local as any).name

          // 支持动态加载的组件，从原来的引用中删除，同时追加组件名
          if (!ruiSpecifiersName.includes(importedName)) {
            // assume need add component
            let needAdd = true
            path
              .findParent((p) => t.isProgram(p))
              .traverse({
                // = Comp.XX
                VariableDeclaration(path) {
                  path.node.declarations.forEach((i) => {
                    const obj = (i.init as any)?.object || {}
                    const property = (i.init as any)?.property

                    if (property && obj.name === localName) {
                      needAdd = false
                      path.stop()
                    }
                  })
                },
                // <Comp.XXX />
                JSXMemberExpression(path) {
                  const obj = path.node?.object as any
                  const property = path.node?.property as any
                  if (property && obj.name === localName) {
                    needAdd = false
                    path.stop()
                  }
                },
              })

            if (needAdd) {
              plugin.updateState('compNames', (prev) =>
                prev.concat({
                  importName: (path.node.imported as any).name,
                  localName: path.node.local.name
                })
              )
              path.remove()
            }
            
          }
        },
      })
      log('transform components include:', plugin.getState().compNames)
      
      // after collecting compNames, begin overwrite
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
