/**
 * @fileoverview Detector for browser support for CSS flexbox support.
 * @see http://dev.w3.org/csswg/css-flexbox
 */

goog.provide('com.qwirx.ui.Flexbox');

/**
 * Detector for browser support for CSS flexbox support.
 * @see http://dev.w3.org/csswg/css-flexbox
 * @constructor
 */
com.qwirx.ui.Flexbox = function(element)
{
	this.enabled = false;
	
	if ('webkitBoxFlex' in element.style)
	{
		this.enabled = true;
		this.boxPrefixJs = 'webkitBox';
		this.boxPrefixCss = '-webkit-box-';
	}
};

com.qwirx.ui.Flexbox.prototype.isEnabled = function()
{
	return this.enabled;
};

com.qwirx.ui.Flexbox.prototype.getBoxPrefixJs = function()
{
	return this.boxPrefixJs;
};

com.qwirx.ui.Flexbox.prototype.getBoxPrefixCss = function()
{
	return this.boxPrefixCss;
};

com.qwirx.ui.Flexbox.prototype.getDisplay = function()
{
	if (this.boxPrefixCss)
	{
		return this.boxPrefixCss.slice(0, -1);
	}
	else
	{
		return "flex";
	}
};
