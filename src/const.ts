/** target library name */
export const libraryName = '@ad/r-ui'

/** react specifier to add */
export const reactSpecifiersName = ['Suspense', 'lazy']

/** useMobile */
export const ruiExtraSpecifier = 'useMobile'

/** whitelist for component specifiers */
export const ruiSpecifiersName = [ruiExtraSpecifier, 'message', 'tooltip']

/** dynamic import template */
export const componentTemplate = `
	const COMPONENT_NAME = (props) => {
		const isMobile = USE_MOBILE

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
