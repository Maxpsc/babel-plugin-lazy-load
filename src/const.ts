/** 处理的包名 */
export const libraryName = '@ad/r-ui'

/** 额外的react引用 */
export const reactSpecifiersName = ['Suspense', 'lazy']

/** useMobile */
export const ruiExtraSpecifier = 'useMobile'

/** 非组件用法的引入，不做特殊处理 */
export const ruiSpecifiersName = [ruiExtraSpecifier, 'message', 'tooltip']

/** 动态加载组件模板 */
export const componentTemplate = `
	const COMPONENT_NAME = (props) => {
		const isMobile = useMobile()

		if (isMobile) {
			const M_COMP_VAR = lazy(() => M_IMPORT)
			return <Suspense fallback={<div>loading~~</div>}>
				<M_COMP_TAG {...props} />
			</Suspense>
		}

		const PC_COMP_VAR = lazy(() => PC_IMPORT)
		return (
			<Suspense fallback={<div>loading~~</div>}>
				<PC_COMP_TAG {...props} />
			</Suspense>
		)
	}
`
