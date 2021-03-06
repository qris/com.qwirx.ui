// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A Javascript clone of the Java
 * <a href="http://docs.oracle.com/javase/7/docs/api/java/awt/BorderLayout.html">BorderLayout</a>,
 * except that our BorderLayout is an actual container and not just
 * a layout for a container.
 */

goog.provide('com.qwirx.ui.BorderLayout');

goog.require('com.qwirx.util.Enum');
goog.require('com.qwirx.util.Exception');
goog.require('com.qwirx.ui.Flexbox');
goog.require('com.qwirx.ui.Renderer');
goog.require('goog.events.EventType');
goog.require('goog.ui.Component');
goog.require('goog.style');
// goog.require('Object.watch');

/**
 * A Javascript clone of the Java
 * <a href="http://docs.oracle.com/javase/7/docs/api/java/awt/BorderLayout.html">BorderLayout</a>,
 * except that our BorderLayout is an actual container and not just
 * a layout for a container.
 *
 * A border layout lays out a container, arranging and resizing its 
 * components to fit in five regions: north, south, east, west, and 
 * center. Each region may contain no more than one component, and is 
 * identified by a corresponding constant: <code>NORTH</code>,
 * <code>SOUTH</code>, <code>EAST</code>, <code>WEST</code>, and
 * <code>CENTER</code>.
 *
 * When adding a component to a container with a border layout, use
 * one of these five constants, for example:
 *
 * <pre>
var parent = new com.qwirx.ui.BorderLayout();
var child = new goog.ui.Component();
parent.addChild(child, opt_render || null, com.qwirx.ui.BorderLayout.CENTER);
 * </pre>
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @param {goog.ui.ContainerRenderer=} opt_renderer Renderer used to
 *     render or decorate the textfield. Defaults to
 *     {@link com.qwirx.ui.BorderLayout.RENDERER}.
 * @constructor
 * @extends {goog.ui.Component}
 */
com.qwirx.ui.BorderLayout = function(opt_domHelper, opt_renderer)
{
	goog.ui.Component.call(this, opt_domHelper);
	this.renderer_ = opt_renderer || com.qwirx.ui.BorderLayout.RENDERER;
	
	this.slots = {};
	var slotNames = com.qwirx.ui.BorderLayout.Constraints;
	
	for (var i in slotNames)
	{
		this.slots[slotNames[i]] = [];
	}
	
	this.resizeListeners = {};
};
goog.inherits(com.qwirx.ui.BorderLayout, goog.ui.Component);

com.qwirx.ui.BorderLayout.Constraints = ['NORTH', 'SOUTH', 'EAST',
	'WEST', 'CENTER'];
com.qwirx.ui.BorderLayout.Constraint = new com.qwirx.util.Enum(
	com.qwirx.ui.BorderLayout.Constraints);

/**
 * Adds the specified control as the last child of this container.  See
 * {@link goog.ui.Component#addChildAt} for detailed semantics.
 *
 * @param {goog.ui.Component} child The new child control.
 * @param {boolean=} opt_render Whether the new child should be rendered
 *     immediately after being added (defaults to false).
 * @override
 */
com.qwirx.ui.BorderLayout.prototype.addChild = function(child,
	opt_render, opt_slot)
{
	goog.asserts.assertInstanceof(child, goog.ui.Component,
		'The child of a BorderLayout must be a Component');
	this.addChildAt(child, this.getChildCount(), opt_render, opt_slot);
	if (this.inDocument_)
	{
		this.handleResize();
	}
};

/**
 * Adds the control as a child of this container at the given 0-based index.
 * Overrides {@link goog.ui.Component#addChildAt} by assigning the
 * child to the specified slot in the BorderLayout, defaulting to
 * <code>CENTER</code>. Only one child is allowed to occupy the
 * <code>CENTER</code> slot at a time.
 *
 * @param {goog.ui.Component} control New child.
 * @param {number} index Index at which the new child is to be added.
 * @param {boolean=} opt_render Whether the new child should be rendered
 *     immediately after being added (defaults to false).
 * @param {string=} opt_slot The layout slot for the new child
 * (defaults to <code>CENTER</code>).
 * @override
 */
com.qwirx.ui.BorderLayout.prototype.addChildAt = function(child,
	index, opt_render, opt_slot)
{
	var slot = opt_slot || com.qwirx.ui.BorderLayout.Constraint.CENTER;
	
	goog.asserts.assert(
		goog.array.contains(com.qwirx.ui.BorderLayout.Constraints, slot),
		"the slot value must be one of " + com.qwirx.ui.BorderLayout.Constraints +
		", not " + slot);
	
	if (slot == com.qwirx.ui.BorderLayout.Constraint.CENTER &&
		this.slots[slot].length > 0)
	{
		throw new com.qwirx.util.Exception('Cannot add another child ' +
			'to the CENTER of a BorderLayout');
	}

	if (child.getParent() == this)
	{
		// remove from whatever slot it's currently in
		goog.object.forEach(this.slots, function(slot, i)
			{
				goog.array.remove(slot, child);
			});
	}
	
	com.qwirx.ui.BorderLayout.superClass_.addChildAt.call(this,
		child, index, false /* opt_render; we will render it ourselves */);
	
	if (opt_render)
	{
		if (!this.getElement())
		{
			this.createDom();
		}
		
		if (this.flexbox.isEnabled())
		{
			this.addChildToFlexDom(child, slot);
		}
		else
		{
			this.child.render(this.compass[slot]);
			var elem = child.getElement();
			if (elem) this.renderer_.applyStyle(elem, slot, true, this.flexbox);
		}
	}
	
	this.slots[slot].push(child);
	
	if (child.isInDocument())
	{
		this.addResizeListener(child);
	}
};

/**
 * Calls the given function on each of this component's children in 
 * <strong>slot</strong> order: NORTH, SOUTH, EAST, WEST and then
 * CENTER.  If {@code opt_obj} is provided, it will be used as the
 * 'this' object in the function when called, instead of the
 * BorderLayout.  The function should take three arguments:  the child
 * component, the slot name and its 0-based index within the slot.
 * The return value is ignored.
 * @param {Function} f The function to call for every child component;
 *    should take 3 arguments as described above.
 * @param {Object=} opt_obj Used as the 'this' object in f when called.
 *    Defaults to the BorderLayout.
 */
goog.ui.Component.prototype.forEachChildBySlot = function(f, opt_obj)
{
	var obj = opt_obj || this;
	
	var slotCodes = com.qwirx.ui.BorderLayout.Constraints;
	for (var i = 0; i < slotCodes.length; i++)
	{
		var slotCode = slotCodes[i];
		var slotContents = this.slots[slotCode];
		for (var j = 0; j < slotContents.length; j++)
		{
			var child = slotContents[j];
			f.call(obj, child, slotCode, j);
		}
	}
};

/**
 * Configures the container after its DOM has been rendered, and
 * sets up event handling. Overrides
 * {@link goog.ui.Component#enterDocument}.
 * @override
 */
com.qwirx.ui.BorderLayout.prototype.enterDocument = function()
{
	// We must do a first pass layout, so that children have a sensible
	// height when we call their enterDocument() methods.
	this.handleResize();
	
	this.getHandler().listen(this.getElement(), goog.events.EventType.RESIZE,
		this.handleResize);
	goog.base(this, 'enterDocument');
};

/**
  * Set the size of the GUI.  This is usually called by the container.
  * This will call handleResize().
  * @param {goog.math.Size} size The size to set the BorderLayout to.
  */
com.qwirx.ui.BorderLayout.prototype.setSize = function(size)
{
	goog.style.setBorderBoxSize(this.getElement(), size);
	this.handleResize();
};

com.qwirx.ui.BorderLayout.prototype.handleResize = function(event)
{
	if (this.flexbox.isEnabled())
	{
		// The browser should have done it for us, so we don't need to
		// do anything here.
		return;
	}

	var elem = this.getElement();
	// var remainingSpace = this.getBoundingClientRect(elem);
	var elemSize = goog.style.getSize(elem);
	var remainingSpace = new goog.math.Rect(0, 0, elemSize.width,
		elemSize.height);

	this.forEachChildBySlot(function(child, slot, index)
		{
			this.placeChild(child, slot, remainingSpace);
		});
};

/**
 * There are cross-browser incompatibilities in
 * DOMElement.getBoundingClientRect(), such as some browsers returning
 * width and height elements and some not, and IE returning values offset
 * by two pixels. Here we patch the first of these.
 * <p>
 * Some day we could correct for IE's 2px offset by copying or using
 * <code>goog.style.getBoundingClientRect_</code> which is currently private.
 * <p>
 * We don't actually care for the right and bottom values at all, only the
 * width and height, so we delete them to avoid confusion/ambiguity.
 * 
 * @param {Element} elem The element to measure
 * @return {goog.math.Rect} The position and size of the element in
 * document (client) coordinate space.
 */
com.qwirx.ui.BorderLayout.prototype.getBoundingClientRect = function(elem)
{
	var box = elem.getBoundingClientRect();
	return new goog.math.Rect(box.left, box.top,
		box.width  || (box.right - box.left),
		box.height || (box.bottom - box.top));
};

/**
 * Add a child in the specified slot. Positions the child
 * automatically in the remaining space.
 * @param {goog.ui.Component} control New child.
 * @param {string} slot The name of the slot in which to place
 * the child, which determines how it fits into the
 * <code>remainingSpace</code>.
 * @param {goog.math.Rect} The remaining space in which to place
 * the <code>child</code>.
 * @return {goog.math.Rect} The new <code>remainingSpace</code>.
 */
com.qwirx.ui.BorderLayout.prototype.placeChild = function(child,
	slot, remainingSpace)
{
	var elem = child.getElement();
	// var minHeight = goog.style.getComputedStyle(elem, 'minHeight');
	// var minWidth = goog.style.getComputedStyle(elem, 'minWidth');
	// var childSize = this.getBoundingClientRect(elem);
	var childSize = goog.style.getBorderBoxSize(elem);
	var slotCodes = com.qwirx.ui.BorderLayout.Constraint;

	if (slot == slotCodes.NORTH || slot == slotCodes.SOUTH)
	{
		childSize.width = remainingSpace.width;
		if (childSize.height > remainingSpace.height)
		{
			childSize.height = remainingSpace.height;
		}
		remainingSpace.height -= childSize.height;
	}
	else if (slot == slotCodes.EAST || slot == slotCodes.WEST)
	{
		if (childSize.width > remainingSpace.width)
		{
			childSize.width = remainingSpace.width;
		}
		childSize.height = remainingSpace.height;
		remainingSpace.width -= childSize.width;
	}
	
	var childPos;
	
	if (slot == slotCodes.NORTH)
	{
		childPos = new goog.math.Rect(remainingSpace.left, remainingSpace.top,
			childSize.width, childSize.height);
		remainingSpace.top += childSize.height;
	}
	else if (slot == slotCodes.SOUTH)
	{
		childPos = new goog.math.Rect(remainingSpace.left,
			remainingSpace.top + remainingSpace.height
			/* already adjusted for childSize.height */,
			childSize.width, childSize.height);
	}
	else if (slot == slotCodes.WEST)
	{
		childPos = new goog.math.Rect(remainingSpace.left, remainingSpace.top,
			childSize.width, childSize.height);
		remainingSpace.left += childSize.width;
	}
	else if (slot == slotCodes.EAST)
	{
		childPos = new goog.math.Rect(
			remainingSpace.left + remainingSpace.width
			/* already adjusted for childSize.width */, remainingSpace.top,
			childSize.width, childSize.height);
	}
	else if (slot == slotCodes.CENTER)
	{
		childPos = remainingSpace;
			
	}
	else
	{
		throw new com.qwirx.util.Exception("Unknown slot code: " + slot);
	}
	
	this.moveAndSize_(elem, childPos);

	if (child.setSize)
	{
		child.setSize(new goog.math.Size(Math.max(childPos.width, 0),
			Math.max(childPos.height, 0)));
	}
};

/**
 * Move and resize a container.  The sizing changes the BorderBoxSize.
 * Based on {@link goog.ui.SplitPane.prototype#moveAndSize_}. but adjusted
 * to use {@link goog.style.setPageOffset}, which appears to use client
 * coordinate space just as <code>getBoundingClientRect</code> does.
 *
 * @param {Element} element The element to move and size.
 * @param {goog.math.Rect} rect The top, left, width and height to change to.
 * @private
 */
com.qwirx.ui.BorderLayout.prototype.moveAndSize_ = function(element, rect)
{
	element.style.position = 'absolute';
	goog.style.setPosition(element, rect.left, rect.top);
	// TODO(user): Add a goog.math.Size.max call for below.
	var newSize = new goog.math.Size(Math.max(rect.width, 0),
		Math.max(rect.height, 0));
	goog.style.setBorderBoxSize(element, newSize);
};

com.qwirx.ui.BorderLayout.prototype.addChildToFlexDom = function(child, slot)
{
	var slotContainer = this.compass[slot];
	child.renderBefore(slotContainer);
	this.renderer_.applyStyle(child.getElement(), slot, true, this.flexbox);
};

/**
 * Creates the container's DOM children for a browser that supports the
 * CSS3 flexbox standard. This should only ever be called once, as it
 * renders any existing children into the relevant DOM children for 
 * flexbox, which is a bad idea if they've already been rendered elsewhere.
 * @override
 */
com.qwirx.ui.BorderLayout.prototype.createFlexboxDom = function()
{
	var elem = this.getElement();
	this.renderer_.applyStyle(elem, 'parent', false, this.flexbox)
	
	this.compass = this.renderer_.createCompassElements(this);
	elem.appendChild(this.compass.NORTH);
	elem.appendChild(this.compass.middle);
	this.compass.middle.appendChild(this.compass.WEST);
	this.compass.middle.appendChild(this.compass.CENTER);
	this.compass.middle.appendChild(this.compass.EAST);
	elem.appendChild(this.compass.SOUTH);
	
	this.forEachChildBySlot(
		function(child, slot, index)
		{
			this.addChildToFlexDom(child, slot);
		});
};

/**
 * Creates the container's DOM using the renderer, instead of
 * ignoring it like the inherited createDom().
 * @override
 */
com.qwirx.ui.BorderLayout.prototype.createDom = function()
{
	// Delegate to renderer.
	this.setElementInternal(this.renderer_.createDom(this));
	this.flexbox = new com.qwirx.ui.Flexbox(this.getElement());
	
	var parent = this;
	
	var elem = this.getElement();
	elem.style.height = "100%";
	elem.style.width = "100%";
	elem.style.position = 'relative';
	var parentNode = elem;
	
	if (this.flexbox.isEnabled())
	{
		this.createFlexboxDom();
	}
	else
	{
		// Create DOM for each child components that is already added to the
		// BorderLayout, and render them into the parent element.
		this.forEachChild(
			function(child)
			{
				// They can't have been rendered yet, because there was nothing
				// to render them into; so do it now. Also this won't call
				// enterDocument because parent_.isInDocument() == false.
				child.render(parentNode);
				this.addResizeListener(child);
			});
	}
};

// http://engineering.silkapp.com/post/31921750832/mutation-events-what-happens?
/*
var attrModifiedWorks = false;
var listener = function(){ attrModifiedWorks = true; };
document.documentElement.addEventListener("DOMAttrModified", listener, false);
document.documentElement.setAttribute("___TEST___", true);
document.documentElement.removeAttribute("___TEST___", true);
document.documentElement.removeEventListener("DOMAttrModified", listener, false);

if (!attrModifiedWorks) 
{
	var oldSetAttribute = HTMLElement.prototype.setAttribute;

	HTMLElement.prototype.setAttribute = function(attrName, newVal)
	{
		var prevVal = this.getAttribute(attrName);
		oldSetAttribute.call(this, attrName, newVal);
		newVal = this.getAttribute(attrName);
		if (newVal != prevVal)
		{
			var evt = document.createEvent("MutationEvent");
			evt.initMutationEvent(
				"DOMAttrModified",
				true,
				false,
				this,
				prevVal || "",
				newVal || "",
				attrName,
				(prevVal == null) ? evt.ADDITION : evt.MODIFICATION
			);
			this.dispatchEvent(evt);
		}
	}
}
*/

com.qwirx.ui.BorderLayout.prototype.addResizeListener = function(child)
{
	var elem = child.getElement();
	var uid = goog.getUid(elem);
	if (uid in this.resizeListeners) return;
	
	this.resizeListeners[uid] = goog.events.listen(elem,
		goog.events.EventType.RESIZE,
		function(event)
		{
			this.handleResize();
		}, false, this);
	
	/*
	elem.watch("clientHeight",
		function (id, oldValue, newValue)
		{
			this.handleResize();
		});
	
	var self = this;
	function handler(event)
	{
		self.handleResize();
	}
	
	elem.addEventListener("DOMAttrModified", handler, false);
	
	var obsClass = null;
	
	if ('MutationObserver' in window)
	{
		obsClass = MutationObserver;
	}
	
	if ('WebKitMutationObserver' in window)
	{
		obsClass = WebKitMutationObserver;
	}
	
	if (obsClass)
	{
		// https://developer.mozilla.org/en-US/docs/DOM/MutationObserver#Example_usage
		var observer = new obsClass(
			function(mutations)
			{
				self.handleResize();
			});
		var config = { attributes: true, childList: false, characterData: false };
		observer.observe(elem, config);
	}
	*/
};

com.qwirx.ui.BorderLayout.prototype.getContentElement = function() {
  return this.currentContentElement_;
};

/**
 * Subclass our standard Renderer to make it create the left, right,
 * top, bottom and centre elements, so that subclasses can override how
 * these elements are styled.
 * 
 * @param {Array} classes The list of CSS classes to be applied to the
 *   BorderLayout container element.
 * @param {string=} opt_compass_class The CSS class to be applied to all
 *   sub-container elements for compass positions (slots). If not supplied,
 *   defaults to <code>com_qwirx_ui_BorderLayout_DefaultRenderer</code>.
 */
com.qwirx.ui.BorderLayout.DefaultRenderer = function(classes,
	opt_compass_class)
{
	goog.base(this, classes);
	this.compass_class = opt_compass_class ||
		'com_qwirx_ui_BorderLayout_DefaultRenderer';
};

goog.inherits(com.qwirx.ui.BorderLayout.DefaultRenderer,
	com.qwirx.ui.Renderer);

com.qwirx.ui.BorderLayout.DefaultRenderer.prototype.applyStyle =
	function(elem, slot, real_child, flexbox)
{
	var browserPrefix = flexbox.getBoxPrefixJs();
	var displayBox = flexbox.getDisplay();
	var slots = com.qwirx.ui.BorderLayout.Constraint;
	
	if (slot == 'parent')
	{
		elem.style[browserPrefix + "Orient"] = "vertical";
	}

	if (slot == 'parent' || slot == 'middle')
	{
		elem.style.display = displayBox;
	}
	
	if (slot == 'middle' || (slot == slots.CENTER && real_child))
	{
		elem.style[browserPrefix + "Flex"] = 1;
	}
	
	if (real_child)
	{
		elem.style.boxSizing = "border-box";
		elem.style.overflow = "hidden";
	}
	
	if (real_child && slot == slots.CENTER)
	{
		/*
		elem.style.position = 'absolute';
		elem.style.width = '100%';
		elem.style.height = '100%';
		*/
	}
	else if (slot == 'middle')
	{
		elem.style.position = 'relative';
	}		
};

com.qwirx.ui.BorderLayout.DefaultRenderer.prototype.createCompassElement =
	function(component, slot, opt_classNames)
{
	var classNames = opt_classNames || ['com_qwirx_ui_BorderLayout'];
	classNames = classNames.slice(0);
	classNames.push(slot);
	var elem = component.getDomHelper().createDom('div', classNames.join(' '));
	this.applyStyle(elem, slot, false, component.flexbox);
	return elem;
};

com.qwirx.ui.BorderLayout.DefaultRenderer.prototype.createCompassElements =
	function(component)
{
	var compass_classes = [this.compass_class];
	var slots = com.qwirx.ui.BorderLayout.Constraint;
	var elements = {}
	elements[slots.NORTH] = this.createCompassElement(component, slots.NORTH,
		compass_classes);
	elements.middle = this.createCompassElement(component, 'middle',
		compass_classes);
	elements[slots.SOUTH] = this.createCompassElement(component, slots.SOUTH,
		compass_classes);
	elements[slots.WEST] = this.createCompassElement(component, slots.WEST,
		compass_classes);
	elements[slots.CENTER] = this.createCompassElement(component, slots.CENTER,
		compass_classes);
	elements[slots.EAST] = this.createCompassElement(component, slots.EAST,
		compass_classes);
	return elements;
};

com.qwirx.ui.BorderLayout.RENDERER = new com.qwirx.ui.BorderLayout.DefaultRenderer(['com_qwirx_ui_BorderLayout']);
