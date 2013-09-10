jQuery.statsd
=============
plugin measuring and reporting times spent on frontend

This plugin can measure and report times spent on arbitrary items in your front-end code. It is backed by Navigation Timing API which you can find in modern browsers. It can report your data to your statsd installation, however, backend code needed for reporting is not included.

Installation
------------
You just need to add the file *jquery.statsd.js* to your JS stack and include contents of *jquery.statsd.scss* in your stylesheet.

Usage
-----
There are two modes of the plugin, first you need to initialize it, any subsequent calls will be considered as measurement points in your code.

### Init
```
$.statsd({
    displayReport: true,
    statsdUrl: '/stats/mark',
    reportEvents: [
		{
			event: 'responseEnd',
			message: 'Response end',
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
    }),
    reportingPercent: 25
});
```
#### Options:
- displayReport: boolean field, setting it true will render a report of all timings on your page too.
- statsdUrl: your API endpoint path for reporting times to statsd.
- reportEvents: data about these Navigation Timing events will be included in the query sent to statsd.
- appendParams: a wrapper method for appending arbitrary values you need in your own environment to the query string of the statsd API call.
- reportingPercent: this percentage of page loads will be reported to statsd. It's purpose is to reduce stress on your statsd API endpoint.

### Measurement
```
$.statsd(message, reporting);
```
#### Parameters
- message: An arbitrary message marking your code.
- reporting: Boolean value, only records with reporting set to *true* will be reported to statsd later.

### Reporting to statsd
Reporting happens automatically on window.onLoad in case you set up *statsdUrl* during init. Plugin is sending data about the Navigation Timing events preconfigured in *reportEvents* as well as data about the measurement points you set up in your own code with *reporting* set to true.
