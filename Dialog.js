/**
 * @fileoverview Extended class for showing modal dialog boxes.
 *
 * Offers a "test mode" where expected dialogs are automatically dismissed
 * with a preselected response, and unexpected dialogs cause an exception
 * to be thrown, to track them down and avoid leaving tests hanging.
 */

goog.provide('com.qwirx.ui.Dialog');
goog.require('goog.ui.Dialog');

/**
 * Extended class for showing modal dialog boxes.
 * 
 * Offers a "test mode" where expected dialogs are automatically dismissed
 * with a preselected response, and unexpected dialogs cause an exception
 * to be thrown, to track them down and avoid leaving tests hanging.
 * 
 * @constructor
 */
com.qwirx.ui.Dialog = function(opt_class, opt_useIframeMask, opt_domHelper)
{
	goog.base(this, opt_class, opt_useIframeMask, opt_domHelper);
};

goog.inherits(com.qwirx.ui.Dialog, goog.ui.Dialog);

com.qwirx.ui.Dialog.isTestMode = false;
com.qwirx.ui.Dialog.dialogResponse = undefined;

com.qwirx.ui.Dialog.prototype.onShow = function()
{
	if (com.qwirx.ui.Dialog.isTestMode)
	{
		if (com.qwirx.ui.Dialog.dialogResponse)
		{
			goog.base(this, 'onShow');
			assertTrue("Dialog should still be visible", this.isVisible());
			
			// click a button in the dialog, check that it goes away
			var buttons = this.getButtonSet();
			// can't use FakeClickEvent because they're not goog.ui.Buttons,
			// so they don't convert mousedown+mouseup into click events
			var button = buttons.getButton(com.qwirx.ui.Dialog.dialogResponse);
			assertNotNull("No such button " + com.qwirx.ui.Dialog.dialogResponse,
				button);
			com.qwirx.test.FakeBrowserEvent.send(goog.events.EventType.CLICK,
				button);
			assertFalse("Dialog should have been closed by clicking " +
				"a button", this.isVisible());
			
			com.qwirx.ui.Dialog.dialogResponse = undefined;
			return true;
		}
		else
		{
			this.setVisible(false);
			fail("A dialog was unexpectedly shown during a test, without " +
				"any planned response: " + this.getContent());
		}
	}
	else
	{
		goog.base(this, 'onShow');
	}
};

