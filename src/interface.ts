import type * as BabelCoreNamespace from '@babel/core'
import type * as BabelTypesNamespace from '@babel/types'

export type Babel = typeof BabelCoreNamespace & { assertVersion: (range: number) => void }

export type BabelTypes = typeof BabelTypesNamespace

export type ProgramNodePath = BabelCoreNamespace.NodePath<BabelCoreNamespace.types.Program>

export type PluginObj = BabelCoreNamespace.PluginObj

export type StringLiteralType = BabelCoreNamespace.types.StringLiteral

export type ImportSpecifier = BabelCoreNamespace.types.ImportSpecifier

export type VisitorType = BabelCoreNamespace.Visitor