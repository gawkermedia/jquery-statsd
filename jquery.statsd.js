/**
 * jQuery plugin measuring and reporting time spent with specific things in the browser
 *
 * @author Jozsef Kozma
 */

'use strict';

/*global define, window, jQuery */

(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define(['lib/jquery'], factory);
	} else {
		factory(jQuery);
	}
}(function ($) {
	if (!window.performance) {
		$.statsd = function () {};
		return null;
	}

	var settings,
		ticks = [];

	$.statsd = function (options) {

		// Default settings you can override in options
		settings = $.extend({
			displayReport: false,
			reportEvents: [
				{
					event: 'responseEnd',
					message: 'Response end',
					reporting: false
				},
				{
					event: 'domContentLoadedEventEnd',
					message: 'DOM content loaded',
					reporting: false
				},
				{
					event: 'domComplete',
					message: 'DOM complete',
					reporting: false
				},
				{
					event: 'loadEventEnd',
					message: 'Load end',
					reporting: true
				}
			],
			appendParams: function (params) {
				return params;
			},
			reportingPercent: 10
		}, options);

		var timing = window.performance.timing,

			ticks = window.statsdTicks,

			reportRendered = false,

			/**
			 * Will render a single line of timing report on your page.
			 * @param  {object} tick Data of the timing to be rendered.
			 */
			appendTick = function (tick) {
				var reporting = (tick.reporting === true) ? 'X' : '';

				$('.advanced-timing-table').append(
					'<tr><td class="text-right">' + (tick.ms - timing.navigationStart) + ' ms</td><td class="text-right">' + (tick.ms - timing.responseEnd) + ' ms</td><td>' + tick.message + '</td><td>' + reporting + '</td></tr>'
				);
			},

			/**
			 * Will render the whole HTML report on your page.
			 */
			renderReport = function () {
				var navStartToLoadEnd = timing.loadEventEnd - timing.navigationStart,
					i,
					l = ticks.length;

				$('body').prepend('<div id="timing-report" class="proxima">' +
					navStartToLoadEnd +	' ms - Navigation Start to Page Load End <br /><hr />' +
					'<table class="advanced-timing-table"><thead><tr><th>Clock</th><th>Relative</th><th>Name</th><th>Reporting</th></tr></thead></table></div>');

				for (i = 0; i < l; i++) {
					appendTick(ticks[i]);
				}

				reportRendered = true;
			},

			/**
			 * Records a new tick.
			 * @param  {object} tick Timing data.
			 */
			newTick = function (tick) {
				ticks.push(tick);

				if (reportRendered === true) {
					appendTick(tick);
				}
			},

			/**
			 * Turns data recorded into query string params.
			 * @param  {array} ticks Timing data to be sent to statsd.
			 * @return {array} Array of strings in key=value pattern.
			 */
			prepareParams = function (ticks) {
				var i,
					l = ticks.length,
					retval = [];

				for (i = 0; i < l; i++) {
					retval.push(ticks[i].message.toLowerCase().replace(/\s/g, '_') + '=' + (ticks[i].ms - timing.responseEnd));
				}

				return retval;
			},

			/**
			 * Sends timing data to your statsd API endpoint.
			 */
			reportTicks = function () {
				var navStartToLoadEnd = timing.loadEventEnd - timing.navigationStart,
					ticksToReport = (function () {
						// only the ones with reporting=true
						var filteredTicks = [],
							i,
							l = ticks.length;

						for (i = 0; i < l; i++) {
							if (ticks[i].reporting === true) {
								filteredTicks.push(ticks[i]);
							}
						}

						return filteredTicks;
					}()),
					params = settings.appendParams(prepareParams(ticksToReport));

				$.getScript(settings.statsdUrl + '?' + params.join('&'));
			};

		$(window).on('load', function () {
			window.setTimeout(function () {
				(function () {
					// sends ticks for Navigation Timing API events configured
					var i,
						l = settings.reportEvents.length;

					for (i = 0; i < l; i++) {
						newTick({
							ms: timing[settings.reportEvents[i].event],
							message: settings.reportEvents[i].message,
							reporting: settings.reportEvents[i].reporting
						});
					}
				}());

				// sorting ticks by time
				ticks = ticks.sort(function (a, b) {
					var retval = 1;

					if (a.ms < b.ms) {
						retval = -1;
					}

					return retval;
				});

				if (settings.displayReport === true) {
					renderReport();
				}

				if (settings.statsdUrl !== undefined) {
					if (Math.floor(Math.random() * 100) < settings.reportingPercent) {
						reportTicks();
					}
				}
			}, 0);
		});

		// after a single initialization, rewrite $.statsd with the lone public method
		$.statsd = function (message, reporting) {
			newTick({
				ms: Date.now(),
				message: message,
				reporting: reporting || false
			});
		};

	};
}));
