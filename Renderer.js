goog.provide('com.qwirx.ui.Renderer');
goog.require('goog.ui.ContainerRenderer');

/**
 * Renderer for {@link goog.ui.Component}s,
 * based on {@link goog.ui.ContainerRenderer} but without the bad
 * behaviours that assume that we're rendering a 
 * {@link goog.ui.Container}, because we're probably not.
 * @constructor
 * @extends {goog.ui.ContainerRenderer}
 * @borrows goog.ui.ControlRenderer.prototype#setAriaRole as this.setAriaRole
 * @borrows goog.ui.ControlRenderer.prototype.setAllowTextSelection as this.setAllowTextSelection
 */
com.qwirx.ui.Renderer = function(opt_classes)
{
	goog.base(this);
	var classes = opt_classes || [com.qwirx.ui.Renderer.CSS_CLASS];
	goog.asserts.assertArray(classes);
	this.classes_ = classes.slice(0);
};
goog.inherits(com.qwirx.ui.Renderer, goog.ui.ContainerRenderer);
goog.addSingletonGetter(com.qwirx.ui.Renderer);

/**
 * Default CSS class to be applied to the root element of toolbars rendered
 * by this renderer.
 * @type {string}
 */
com.qwirx.ui.Renderer.CSS_CLASS = goog.getCssName('com_qwirx_ui');

/**
 * Returns all CSS class names applicable to the given container, based on its
 * state.  The array of class names returned includes the renderer's own CSS
 * class, followed by a CSS class indicating the container's orientation,
 * followed by any state-specific CSS classes.
 * @return {Array.<string>} Array of CSS class names applicable to the
 *     container.
 */
com.qwirx.ui.Renderer.prototype.getClassNames = function()
{
	return this.classes_.slice(0);
};

com.qwirx.ui.Renderer.prototype.setAriaRole =
	goog.ui.ControlRenderer.prototype.setAriaRole;
com.qwirx.ui.Renderer.prototype.setAllowTextSelection =
	goog.ui.ControlRenderer.prototype.setAllowTextSelection;

/**
 * Updates the control's DOM by adding or removing the specified extra class
 * name to/from its element.
 * @param {goog.ui.Control} control Control to be updated.
 * @param {string} className CSS class name to add or remove.
 * @param {boolean} enable Whether to add or remove the class name.
 */
com.qwirx.ui.Renderer.prototype.enableExtraClassName =
	goog.ui.ControlRenderer.prototype.enableExtraClassName;

com.qwirx.ui.Renderer.prototype.enableClassName =
	goog.ui.ControlRenderer.prototype.enableClassName;

/**
 * Takes a single {@link goog.ui.Component.State}, and returns the
 * corresponding CSS class name (null if none).
 * @param {goog.ui.Component.State} state Component state.
 * @return {string|undefined} CSS class representing the given state (undefined
 *     if none).
 * @protected
 */
com.qwirx.ui.Renderer.prototype.getClassForState = 
	goog.ui.ControlRenderer.prototype.getClassForState;

/**
 * Updates the appearance of the control in response to a state change.
 * @param {goog.ui.Control} control Control instance to update.
 * @param {goog.ui.Component.State} state State to enable or disable.
 * @param {boolean} enable Whether the control is entering or exiting the state.
 */
com.qwirx.ui.Renderer.prototype.setState =
	goog.ui.ControlRenderer.prototype.setState;

/**
 * Creates the lookup table of states to classes, used during state changes.
 * @private
 */
com.qwirx.ui.Renderer.prototype.createClassByStateMap_ =
	goog.ui.ControlRenderer.prototype.createClassByStateMap_;

/**
 * Returns the name of a DOM structure-specific CSS class to be applied to the
 * root element of all components rendered or decorated using this renderer.
 * Unlike the class name returned by {@link #getCssClass}, the structural class
 * name may be shared among different renderers that generate similar DOM
 * structures.  The structural class name also serves as the basis of derived
 * class names used to identify and style structural elements of the control's
 * DOM, as well as the basis for state-specific class names.  The default
 * implementation returns the same class name as {@link #getCssClass}, but
 * subclasses are expected to override this method as needed.
 * @return {string} DOM structure-specific CSS class name (same as the renderer-
 *     specific CSS class name by default).
 */
com.qwirx.ui.Renderer.prototype.getStructuralCssClass = function()
{
	return this.classes_[0];
};

com.qwirx.ui.Renderer.prototype.updateAriaState =
	goog.ui.ControlRenderer.prototype.updateAriaState;

/**
 * Returns true if the control's key event target supports keyboard focus
 * (based on its {@code tabIndex} attribute), false otherwise.
 * @param {goog.ui.Control} control Control whose key event target is to be
 *     checked.
 * @return {boolean} Whether the control's key event target is focusable.
 */
com.qwirx.ui.Renderer.prototype.isFocusable =
	goog.ui.ControlRenderer.prototype.isFocusable;

/**
 * @return {boolean} true if the element is shown (by a call to setVisible())
 * or false if not.
 */
com.qwirx.ui.Renderer.prototype.isVisible = function(element)
{
	return goog.style.isElementShown(element);
};

/**
 * Shows or hides the element.
 * @param {Element} element Element to update.
 * @param {boolean} visible Whether to show the element.
 */
com.qwirx.ui.Renderer.prototype.setVisible =
	goog.ui.ControlRenderer.prototype.setVisible;

/**
 * Updates the control's key event target to make it focusable or non-focusable
 * via its {@code tabIndex} attribute.  Does nothing if the control doesn't
 * support the {@code FOCUSED} state, or if it has no key event target.
 * @param {goog.ui.Control} control Control whose key event target is to be
 *     updated.
 * @param {boolean} focusable Whether to enable keyboard focus support on the
 *     control's key event target.
 */
com.qwirx.ui.Renderer.prototype.setFocusable =
	goog.ui.ControlRenderer.prototype.setFocusable;

/**
 * Initializes the container's DOM when the container enters the document.
 * Called from {@link goog.ui.Container#enterDocument}.
 * Overridden to ensure that it behaves consistently with
 * setAllowTextSelection() regarding the use of recursion in different
 * browsers: 
 * https://groups.google.com/forum/#!topic/closure-library-discuss/nTOHWfr3WTw
 * @param {goog.ui.Container} container Container whose DOM is to be initialized
 *     as it enters the document.
 */
com.qwirx.ui.Renderer.prototype.initializeDom = function(container)
{
	var elem = container.getElement();

	// Make sure the container's element isn't selectable.
	// changed here:
	this.setAllowTextSelection(elem, false);

	// IE doesn't support outline:none, so we have to use the hideFocus property.
	if (goog.userAgent.IE)
	{
		elem.hideFocus = true;
	}

	// Set the ARIA role.
	var ariaRole = this.getAriaRole();
	if (ariaRole)
	{
		goog.dom.a11y.setRole(elem, ariaRole);
	}
};

