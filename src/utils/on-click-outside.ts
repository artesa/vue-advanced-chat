/**
 * Modified for Vue 3 from https://github.com/ndelvalle/v-click-outside
 * Cf. https://github.com/ndelvalle/v-click-outside/issues/238
 */
import type { Directive, DirectiveBinding } from 'vue'

interface HandlerEntry {
	event: string
	srcTarget: HTMLElement | Window
	handler: (event: Event) => void
	capture: boolean
}

interface BindingValueObject {
	handler: (event: Event) => void
	middleware?: (event: Event) => boolean
	events?: string[]
	isActive?: boolean
	detectIframe?: boolean
	capture?: boolean
}

type BindingValue = ((event: Event) => void) | BindingValueObject

interface ProcessedDirectiveArgs {
	handler: (event: Event) => void
	middleware: (event: Event) => boolean
	events: string[]
	isActive: boolean
	detectIframe: boolean
	capture: boolean
}

const HANDLERS_PROPERTY = '__v-click-outside'
const HAS_WINDOWS = typeof window !== 'undefined'
const HAS_NAVIGATOR = typeof navigator !== 'undefined'
const IS_TOUCH
	= HAS_WINDOWS
		&& ('ontouchstart' in window
			|| (HAS_NAVIGATOR && (navigator as any).msMaxTouchPoints > 0))
const EVENTS = IS_TOUCH ? ['touchstart'] : ['click']
function processDirectiveArguments(bindingValue: BindingValue): ProcessedDirectiveArgs {
	const isFunction = typeof bindingValue === 'function'
	if (!isFunction && typeof bindingValue !== 'object') {
		throw new Error(
			'v-click-outside: Binding value must be a function or an object',
		)
	}
	return {
		handler: isFunction ? bindingValue : bindingValue.handler,
		middleware: (isFunction ? undefined : bindingValue.middleware) || (((item: Event) => item) as unknown as (event: Event) => boolean),
		events: (isFunction ? undefined : bindingValue.events) || EVENTS,
		isActive: !((bindingValue as BindingValueObject).isActive === false),
		detectIframe: !((bindingValue as BindingValueObject).detectIframe === false),
		capture: Boolean((bindingValue as BindingValueObject).capture),
	}
}
function execHandler({ event, handler, middleware }: { event: Event, handler: (event: Event) => void, middleware: (event: Event) => boolean }): void {
	if (middleware(event)) {
		handler(event)
	}
}
function onFauxIframeClick({ el, event, handler, middleware }: { el: HTMLElement, event: Event, handler: (event: Event) => void, middleware: (event: Event) => boolean }): void {
	// Note: on firefox clicking on iframe triggers blur, but only on
	//       next event loop it becomes document.activeElement
	// https://stackoverflow.com/q/2381336#comment61192398_23231136
	setTimeout(() => {
		const { activeElement } = document
		if (
			activeElement
			&& activeElement.tagName === 'IFRAME'
			&& !el.contains(activeElement)
		) {
			execHandler({ event, handler, middleware })
		}
	}, 0)
}
function onEvent({ el, event, handler, middleware }: { el: HTMLElement, event: Event, handler: (event: Event) => void, middleware: (event: Event) => boolean }): void {
	// Note: composedPath is not supported on IE and Edge, more information here:
	//       https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath
	//       In the meanwhile, we are using el.contains for those browsers, not
	//       the ideal solution, but using IE or EDGE is not ideal either.
	const path = (event as any).path || (event.composedPath && event.composedPath())
	const isClickOutside = path
		? !path.includes(el)
		: !el.contains(event.target as Node)
	if (!isClickOutside) {
		return
	}
	execHandler({ event, handler, middleware })
}
function beforeMount(el: HTMLElement, { value }: DirectiveBinding<BindingValue>): void {
	const {
		events,
		handler,
		middleware,
		isActive,
		detectIframe,
		capture,
	} = processDirectiveArguments(value)
	if (!isActive) {
		return
	}
	;(el as any)[HANDLERS_PROPERTY] = events.map(eventName => ({
		event: eventName,
		srcTarget: document.documentElement,
		handler: (event: Event) => onEvent({ el, event, handler, middleware }),
		capture,
	}))
	if (detectIframe) {
		const detectIframeEvent: HandlerEntry = {
			event: 'blur',
			srcTarget: window,
			handler: (event: Event) => onFauxIframeClick({ el, event, handler, middleware }),
			capture,
		}
		;(el as any)[HANDLERS_PROPERTY] = [...(el as any)[HANDLERS_PROPERTY], detectIframeEvent]
	}
	;((el as any)[HANDLERS_PROPERTY] as HandlerEntry[]).forEach(({ event, srcTarget, handler: thisHandler }) =>
		setTimeout(() => {
			// Note: More info about this implementation can be found here:
			//       https://github.com/ndelvalle/v-click-outside/issues/137
			if (!(el as any)[HANDLERS_PROPERTY]) {
				return
			}
			srcTarget.addEventListener(event, thisHandler, capture)
		}, 0),
	)
}
function unmounted(el: HTMLElement): void {
	const handlers: HandlerEntry[] = (el as any)[HANDLERS_PROPERTY] || []
	handlers.forEach(({ event, srcTarget, handler, capture }) =>
		srcTarget.removeEventListener(event, handler, capture),
	)
	delete (el as any)[HANDLERS_PROPERTY]
}
function updated(el: HTMLElement, { value, oldValue }: DirectiveBinding<BindingValue>): void {
	if (JSON.stringify(value) === JSON.stringify(oldValue)) {
		return
	}
	unmounted(el)
	beforeMount(el, { value } as DirectiveBinding<BindingValue>)
}
const directive: Directive<HTMLElement, BindingValue> = {
	beforeMount,
	updated,
	unmounted,
}
export default HAS_WINDOWS ? directive : {}
