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
	assertEquals(com.qwirx.ui.BorderLayout.Renderer.getInstance(),
		bl.renderer_);
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
	bl.addChild(child1, false);
	bl.createDom();
	assertNotNull("child DOM element should have been created by " +
		"calling createDom", child1.getElement());
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
	
	var children = goog.dom.getChildren(domContainer);
	assertObjectEquals([bl.getElement()],
		Array.prototype.slice.call(children, 0));
	
	children = goog.dom.getChildren(bl.getElement());
	assertObjectEquals("the child's DOM element should have been added " +
		"as a child of the parent's DOM element", [child1.getElement()],
		Array.prototype.slice.call(children, 0));
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
	
	children = goog.dom.getChildren(bl.getElement());
	assertObjectEquals([child1.getElement()],
		Array.prototype.slice.call(children, 0));
}

function test_add_multiple_children_to_center_slot()
{
	var bl = new com.qwirx.ui.BorderLayout();

	var child1 = new goog.ui.Control("<h1>Hello!</h1>" /* CENTER */);
	bl.addChild(child1, true);
	assertObjectEquals([child1], bl.slots['CENTER']);

	var child2 = new goog.ui.Control("<h1>World!</h1>" /* CENTER */);
	var e = assertThrows(function()
		{
			bl.addChild(child2, true);
		});
	goog.asserts.assertInstanceof(e, com.qwirx.util.Exception,
		"The exception thrown was not an instance of com.qwirx.util.Exception"	);
	
	var e = assertThrows(function()
		{
			bl.addChild(child2, true, 'CENTER');
		});
	goog.asserts.assertInstanceof(e, com.qwirx.util.Exception,
		"The exception thrown was not an instance of com.qwirx.util.Exception"	);

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
	
	var children = goog.dom.getChildren(domContainer);
	assertObjectEquals([bl.getElement()],
		Array.prototype.slice.call(children, 0));
	
	children = goog.dom.getChildren(bl.getElement());
	assertObjectEquals([child1.getElement(), child2.getElement()],
		Array.prototype.slice.call(children, 0));
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
