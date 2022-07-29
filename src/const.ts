/** target library name */
export const libraryName = '@ad/r-ui'

/** react specifier to add */
export const reactSpecifiersName = ['Suspense', 'lazy', 'forwardRef', 'useState', 'useEffect']

/** useMobile */
export const ruiExtraSpecifier = 'useMobile'

/** whitelist for component specifiers */
export const ruiSpecifiersName = [ruiExtraSpecifier, 'message', 'tooltip']

/** dynamic import template */
export const componentTemplate = `
	const COMPONENT_NAME = forwardRef((props, ref) => {
		const isMobile = USE_MOBILE
		const [Comp, setComp] = useState(null)

		useEffect(() => {
			setComp(lazy(() => isMobile ? M_IMPORT : PC_IMPORT))
		}, [isMobile])

		return <Suspense fallback={null}>
			{Comp ? <Comp ref={ref} {...props} /> : null}
		</Suspense>
	})
`