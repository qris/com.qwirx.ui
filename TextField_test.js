goog.provide('com.qwirx.ui.TextField_test');

goog.require('com.qwirx.ui.TextField');
goog.require('goog.testing.jsunit');

var domContainer = goog.dom.createDom(goog.dom.TagName.DIV,
	{'style': 'background-color: #eee; width: 50%; height: 300px; ' +
	'float: right; opacity: 0.7;'});
goog.dom.appendChild(document.body, domContainer);

function setUp()
{
	goog.dom.removeChildren(domContainer);
}

/**
 * Test for issue with initial content of a TextField, caused by
 * https://code.google.com/p/closure-library/issues/detail?id=594
 */
function test_initial_content()
{
	var tf1 = new com.qwirx.ui.TextField("1");
	var tf2 = new com.qwirx.ui.TextField("hello");
	tf1.render(domContainer);
	tf2.render(domContainer);
	assertEquals("hello", tf2.getContent());
	assertEquals("1", tf1.getContent());
	assertEquals("hello", tf2.getElement().value);
	assertEquals("1", tf1.getElement().value);
}

/**
 * Test for https://code.google.com/p/closure-library/issues/detail?id=594.
 * This is not really a bug, because INPUT elements aren't allowed to have
 * content, so appending a text node inside them is not a valid operation.
 */
/*
function test_domhelper_append()
{
	var dom = goog.dom.getDomHelper();
	var element = dom.createDom('input', {
		'type': 'text',
	}, "1");
	assertEquals("1", element.innerHTML);
};
*/

function test_goog_dom_append_text_to_div()
{
	var dom = goog.dom.getDomHelper();
	var element = dom.createDom('div');
	goog.dom.append(element, "hello");
	assertEquals("hello", element.innerHTML);
};
