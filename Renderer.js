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
