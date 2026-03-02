export function findParentBySelector(node: ParentNode | null, selector: string): Element | null {
	while (node && !node.querySelector(selector)) {
		node = (node as Node).parentNode
		const element = node?.querySelector(selector)
		if (element)
			return element
	}
	return null
}
