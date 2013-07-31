/**
 * @fileoverview Modified goog.ui.Slider.
 *
 * Don't reset mute in setThumbPosition_(). Otherwise it's impossible to
 * respond to a setValue() event with anything that calls setValue() again.
 */

goog.provide('com.qwirx.ui.Slider');
goog.require('goog.ui.Slider');

/**
 * This creates a SliderBase object.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
com.qwirx.ui.Slider = function(opt_domHelper)
{
	goog.base(this, opt_domHelper);
};

goog.inherits(com.qwirx.ui.Slider, goog.ui.Slider);

/**
 * @inheritdoc
 */
com.qwirx.ui.Slider.prototype.setValueAndExtent = function(value, extent)
{
	if (this.getMinimum() <= value &&
		value <= this.getMaximum() - extent &&
		this.minExtent_ <= extent &&
		extent <= this.getMaximum() - value)
	{
		if (value == this.getValue() && extent == this.getExtent())
		{
			return;
		}
		// because the underlying range model applies adjustements of value
		// and extent to fit within bounds, we need to reset the extent
		// first so these adjustements don't kick in.
		var oldMute = this.rangeModel.mute_;
		this.rangeModel.setMute(true);
		this.rangeModel.setExtent(0);
		this.rangeModel.setValue(value);
		this.rangeModel.setExtent(extent);
		this.rangeModel.setMute(oldMute);
		this.handleRangeModelChange(null);
	}
};

/**
 * If events are muted, then don't send CHANGE events.
 */
goog.ui.SliderBase.prototype.handleRangeModelChange = function(e) {
	this.updateUi_();
	this.updateAriaStates();
	if (!this.rangeModel.mute_)
	{
		this.dispatchEvent(goog.ui.Component.EventType.CHANGE);
	}
};