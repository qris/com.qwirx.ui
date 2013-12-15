goog.provide('com.qwirx.ui.BorderLayout_test');

goog.require('com.qwirx.util.Exception');
goog.require('com.qwirx.ui.BorderLayout');
goog.require('com.qwirx.test.assertThrows');
goog.require('com.qwirx.test.findDifferences');
goog.require('goog.testing.jsunit');

var domContainer = goog.dom.createDom(goog.dom.TagName.DIV,
	{'style': 'background-color: #eee; width: 50%; height: 300px; ' +
	'float: right; opacity: 0.7;'});
goog.dom.appendChild(document.body, domContainer);

function setUp()
{
	goog.dom.removeChildren(domContainer);
}

function test_constructor()
{
	var bl = new com.qwirx.ui.BorderLayout();
	assertEquals(com.qwirx.ui.BorderLayout.RENDERER, bl.renderer_);
	var slotNames = com.qwirx.ui.BorderLayout.Constraints;
	
	for (var i in slotNames)
	{
		assertObjectEquals([], bl.slots[slotNames[i]]);
	}		
}

function test_render()
{
	var bl = new com.qwirx.ui.BorderLayout();
	var children = goog.dom.getChildren(domContainer);
	assertObjectEquals([], Array.prototype.slice.call(children, 0));
	
	bl.render(domContainer);
	children = goog.dom.getChildren(domContainer);
	assertObjectEquals([bl.getElement()],
		Array.prototype.slice.call(children, 0));
}

function test_createDom()
{
	var bl = new com.qwirx.ui.BorderLayout();
	var child1 = new goog.ui.Control("<h1>Hello!</h1>");
	child1.setAllowTextSelection(true);
	bl.addChild(child1, false);
	
	bl.createDom();
	assertNotNull("child DOM element should have been created by " +
		"calling createDom", child1.getElement());
	
	var elem = bl.getElement();
	assertEquals("BorderLayout should fill 100% of parent element",
		"100%", elem.style.height);
	assertEquals("BorderLayout should fill 100% of parent element",
		"100%", elem.style.width);
	
	bl.render(domContainer);
	var userSelect = goog.style.getComputedStyle(child1.getElement(),
		'webkitUserSelect');
	assertEquals("If webkitUserSelect is 'none' then controls in the " +
		"BorderLayout won't be usable/editable", "text", userSelect);
}

function assert_one_child_in_center(bl, child)
{
	if (bl.flexbox.isEnabled())
	{
		com.qwirx.test.assertArrayEquals([bl.compass.NORTH, bl.compass.middle,
			bl.compass.SOUTH], goog.dom.getChildren(bl.getElement()));
		com.qwirx.test.assertArrayEquals([bl.compass.WEST, child.getElement(),
			bl.compass.CENTER, bl.compass.EAST],
			goog.dom.getChildren(bl.compass.middle));
	}
	else
	{
		com.qwirx.test.assertArrayEquals([child.getElement()],
			goog.dom.getChildren(bl.getElement()));
	}
}

function test_add_child_before_render()
{
	var bl = new com.qwirx.ui.BorderLayout();
	var child1 = new goog.ui.Control("<h1>Hello!</h1>");
	bl.addChild(child1, false);
	assertObjectEquals([child1], bl.slots['CENTER']);
	
	bl.render(domContainer);
	assertNotNull("child DOM element should have been created by " +
		"calling createDom (indirectly via render())", child1.getElement());
	
	assert_one_child_in_center(bl, child1);
	assertEquals("border-box", child1.getElement().style.boxSizing);
	assertEquals("hidden", child1.getElement().style.overflow);
}

function test_add_child_after_render()
{
	var bl = new com.qwirx.ui.BorderLayout();
	bl.render(domContainer);
	
	var children = goog.dom.getChildren(domContainer);
	assertObjectEquals([bl.getElement()],
		Array.prototype.slice.call(children, 0));

	var child1 = new goog.ui.Control("<h1>Hello!</h1>");
	bl.addChild(child1, true);
	assertObjectEquals([child1], bl.slots['CENTER']);
	
	assert_one_child_in_center(bl, child1);
	assertEquals("border-box", child1.getElement().style.boxSizing);
	assertEquals("hidden", child1.getElement().style.overflow);
}

function test_add_multiple_children_to_center_slot()
{
	var bl = new com.qwirx.ui.BorderLayout();

	var child1 = new goog.ui.Control("<h1>Hello!</h1>" /* CENTER */);
	bl.addChild(child1, true);
	assertObjectEquals([child1], bl.slots['CENTER']);

	var child2 = new goog.ui.Control("<h1>World!</h1>" /* CENTER */);
	com.qwirx.test.assertThrows(com.qwirx.util.Exception,
		function()
		{
			bl.addChild(child2, true);
		},
		"Adding another child with no specified position should be " +
		"equivalent to adding it to CENTER, which is not allowed");
	
	com.qwirx.test.assertThrows(com.qwirx.util.Exception,
		function()
		{
			bl.addChild(child2, true, 'CENTER');
		},
		"Adding a second child to the CENTER position should not be allowed");

	bl.addChild(child2, true, 'NORTH');
	assertObjectEquals([child2], bl.slots['NORTH']);
	assertObjectEquals([child1], bl.slots['CENTER']);
}

function test_add_child_twice()
{
	var bl = new com.qwirx.ui.BorderLayout();

	var child1 = new goog.ui.Control("<h1>Hello!</h1>");
	bl.addChild(child1, true);
	assertObjectEquals([child1], bl.slots['CENTER']);

	bl.addChild(child1, true, 'EAST');
	assertObjectEquals([], bl.slots['CENTER']);
	assertObjectEquals([child1], bl.slots['EAST']);
}

function test_add_children()
{
	var bl = new com.qwirx.ui.BorderLayout();

	var child1 = new goog.ui.Control("<h1>Hello!</h1>");
	bl.addChild(child1, true);
	assertObjectEquals([child1], bl.slots['CENTER']);

	var child2 = new goog.ui.Control("<h1>World!</h1>");
	bl.addChild(child2, true, 'SOUTH');
	assertObjectEquals([child1], bl.slots['CENTER']);
	assertObjectEquals([child2], bl.slots['SOUTH']);

	bl.render(domContainer);
	
	com.qwirx.test.assertArrayEquals([bl.getElement()],
		goog.dom.getChildren(domContainer));
	
	if (bl.flexbox.isEnabled())
	{
		com.qwirx.test.assertArrayEquals([bl.compass.NORTH, bl.compass.middle,
			child2.getElement(), bl.compass.SOUTH],
			goog.dom.getChildren(bl.getElement()));
		com.qwirx.test.assertArrayEquals([bl.compass.WEST, child1.getElement(),
			bl.compass.CENTER, bl.compass.EAST],
			goog.dom.getChildren(bl.compass.middle));
		
		var browserPrefix = bl.flexbox.getBoxPrefixJs();
		assertContains(browserPrefix, ['webkitBox']);
		var displayBox = bl.flexbox.getDisplay();
		assertContains(displayBox, ['-webkit-box']);
		
		var expected = {
			// display, boxOrient, boxFlex
			parent: [displayBox, 'vertical', ''],
			NORTH:  ['',         '',         ''],
			middle: [displayBox, '',         '1'],
			SOUTH:  ['',         '',         ''],
			WEST:   ['',         '',         ''],
			CENTER_placeholder: ['',         '',         ''],
			CENTER_real: ['',         '',         '1'],
			EAST:   ['',         '',         ''],
		};
		
		function assertChildStyles(child, slot, placeholder)
		{
			var values;
			var suffix = placeholder ? "_placeholder" : "_real";
			
			if (slot + suffix in expected)
			{
				values = expected[slot+suffix];
			}
			else
			{
				values = expected[slot];
			}
			
			assertEquals("wrong value for "+slot+" element's display property",
				values[0], child.style.display);
			assertEquals("wrong value for "+slot+" element's boxOrient property",
				values[1], child.style[browserPrefix + "Orient"]);
			assertEquals("wrong value for "+slot+" element's boxFlex property",
				values[2], child.style[browserPrefix + "Flex"]);
		}
		
		goog.object.forEach(com.qwirx.ui.BorderLayout.Constraints,
			function(slot, i)
			{
				assertChildStyles(bl.compass[slot], slot, true /* placeholder */);
			});
		assertChildStyles(bl.getElement(), 'parent', false /* placeholder */);
		assertChildStyles(child1.getElement(), 'CENTER', false /* placeholder */);
		assertChildStyles(child2.getElement(), 'SOUTH', false /* placeholder */);
	}
	else
	{
		com.qwirx.test.assertArrayEquals(
			[child1.getElement(), child2.getElement()],
			goog.dom.getChildren(bl.getElement()));
	}
}

/**
 * Child components should be expected to do work when enterDocument()
 * is called, and they should know their size (roughly) at that point.
 * It's not always possible to know their exact size, but they should have
 * been given a non-zero size before BorderLayout calls their enterDocument
 * method.
 */
function test_children_laid_out_before_enterDocument()
{
	com.qwirx.test.assertGreaterThan(domContainer.clientHeight, 0,
		"domContainer must have a clientHeight, or this test cannot pass");
	
	var bl = new com.qwirx.ui.BorderLayout();

	var child1 = new goog.ui.Control("I should fill the rest of the space");
	var child2 = new goog.ui.Control("I should be at the bottom");
	child1.addClassName("red-border");
	child2.addClassName("blue-border");
	
	var enterDocumentCalled = false;
	
	child1.enterDocument = function()
	{
		var bs = goog.style.getBorderBoxSize(bl.getElement());
		com.qwirx.test.assertGreaterThan(bs.height, 0,
			"parent should have been given a height before " +
			"enterDocument() is called");
		var c1 = goog.style.getBorderBoxSize(child1.getElement());
		com.qwirx.test.assertGreaterThan(c1.height, 0,
			"child should have been given a height before " +
			"enterDocument() is called");
		var c2 = goog.style.getBorderBoxSize(child2.getElement());
		com.qwirx.test.assertGreaterThan(c2.height, 0,
			"child should have been given a height before " +
			"enterDocument() is called");
		assertEquals("children should have been given sizes adding up " +
			"to the container size, before their enterDocument() methods " +
			"are called", domContainer.clientHeight,
			c1.height + c2.height);
		enterDocumentCalled = true;
		goog.base(this, 'enterDocument');
	};
	
	bl.addChild(child1, true);
	bl.addChild(child2, true, 'SOUTH');
	bl.render(domContainer);
	assertTrue("child enterDocument method should have been called",
		enterDocumentCalled);
}

function makeRectValues(left, top, width, height)
{
	return {
		left:   left.toFixed(0),
		top:    top.toFixed(0),
		width:  width.toFixed(0),
		height: height.toFixed(0)
	};
}

function getRectValues(rect)
{
	return makeRectValues(rect.left, rect.top, rect.width, rect.height);
}

function assertChildShape(bl, slot, container_rect, left_ratio, right_ratio,
	top_ratio, bottom_ratio)
{
	var child = bl.slots[slot][0];
	if (child)
	{
		var childShape = child.getElement().getBoundingClientRect();
		assertObjectEquals("wrong position for child in " + slot + " slot",
			makeRectValues(
				container_rect.left + container_rect.width  * left_ratio,
				container_rect.top  + container_rect.height * top_ratio,
				container_rect.width  * (right_ratio  - left_ratio),
				container_rect.height * (bottom_ratio - top_ratio)),
			getRectValues(childShape));
	}
}

function assertChildShapes(bl, left_ratio, right_ratio, top_ratio, bottom_ratio)
{
	var container_rect = bl.getElement().getBoundingClientRect();
	
	assertChildShape(bl, 'NORTH', container_rect, 0, 1, 0, top_ratio);
	assertChildShape(bl, 'SOUTH', container_rect, 0, 1, bottom_ratio, 1);
	assertChildShape(bl, 'WEST', container_rect, 0, left_ratio,
		top_ratio, bottom_ratio);
	assertChildShape(bl, 'EAST', container_rect, right_ratio, 1,
		top_ratio, bottom_ratio);
	assertChildShape(bl, 'CENTER', container_rect, left_ratio, right_ratio,
		top_ratio, bottom_ratio);
}

function test_add_children_updates_layout()
{
	var bl = new com.qwirx.ui.BorderLayout();
	bl.render(domContainer);
	var bs = domContainer.getBoundingClientRect();
	
	var centre = new goog.ui.Control("I should fill the rest of the space");
	centre.addClassName("red-border");
	bl.addChild(centre, true, com.qwirx.ui.BorderLayout.Constraint.CENTER);
	var cs = centre.getElement().getBoundingClientRect();
	assertObjectEquals("wrong size for centre element", bs, cs);
	assertChildShapes(bl, 0, 1, 0, 1);
	
	var west = new goog.ui.Control("<h1>West!</h1>");
	west.addClassName("blue-border");
	west.createDom();
	west.getElement().style.width = "15%";
	bl.addChild(west, true, com.qwirx.ui.BorderLayout.Constraint.WEST);
	assertChildShapes(bl, 0.15, 1, 0, 1);
	
	var south = new goog.ui.Control("<h1>South!</h1>");
	south.addClassName("blue-border");
	south.createDom();
	south.getElement().style.height = "22%";
	bl.addChild(south, true, com.qwirx.ui.BorderLayout.Constraint.SOUTH);
	assertChildShapes(bl, 0.15, 1, 0, 0.78);
	
	var east = new goog.ui.Control("<h1>East!</h1>");
	east.addClassName("blue-border");
	east.createDom();
	east.getElement().style.width = "17%";
	bl.addChild(east, true, com.qwirx.ui.BorderLayout.Constraint.EAST);
	assertChildShapes(bl, 0.15, 0.83, 0, 0.78);
	
	var north = new goog.ui.Control("<h1>North!</h1>");
	north.addClassName("blue-border");
	north.createDom();
	north.getElement().style.height = "40%";
	bl.addChild(north, true, com.qwirx.ui.BorderLayout.Constraint.NORTH);
	assertChildShapes(bl, 0.15, 0.83, 0.4, 0.78);
}

function test_resize_child_updates_layout()
{
	var bl = new com.qwirx.ui.BorderLayout();
	bl.render(domContainer);
	var bs = domContainer.getBoundingClientRect();
	
	var centre = new goog.ui.Control("I should fill the rest of the space");
	centre.addClassName("red-border");
	bl.addChild(centre, true, com.qwirx.ui.BorderLayout.Constraint.CENTER);
	var cs = centre.getElement().getBoundingClientRect();
	assertObjectEquals(bs, 	cs);
	assertChildShapes(bl, 0, 1, 0, 1);
	
	var south = new goog.ui.Control("<h1>South!</h1>");
	south.addClassName("blue-border");
	south.createDom();
	south.getElement().style.height = "22%";
	bl.addChild(south, true, com.qwirx.ui.BorderLayout.Constraint.SOUTH);
	assertChildShapes(bl, 0, 1, 0, 0.78);
	
	south.getElement().style.height = "18%";
	assertChildShapes(bl, 0, 1, 0, 0.82);
}

function test_construct_flexbox()
{
	var fakeElem = {style: {}};
	var flex = new com.qwirx.ui.Flexbox(fakeElem);
	assertFalse("Flexbox should not be enabled if DOM elements have no " +
		"trace of box-flex styles", flex.isEnabled());
	assertEquals("Display property should be set appropriately",
		'flex', flex.getDisplay());
	
	fakeElem.style = {webkitBoxFlex: undefined};
	flex = new com.qwirx.ui.Flexbox(fakeElem);
	assertTrue("Flexbox should be enabled if DOM elements have " +
		"a webkit-box-flex style, even if its value is undefined",
		flex.isEnabled());
	assertEquals("Flexbox prefix should be set appropriately for Webkit " +
		"browsers", 'webkitBox', flex.getBoxPrefixJs());
	assertEquals("Flexbox prefix should be set appropriately for Webkit " +
		"browsers", '-webkit-box-', flex.getBoxPrefixCss());
	assertEquals("Display property should be set appropriately",
		'-webkit-box', flex.getDisplay());
};
