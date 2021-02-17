// https://stackoverflow.com/questions/19491336/how-to-get-url-parameter-using-jquery-or-plain-javascript
var getUrlParameter = function getUrlParameter(sParam) {
	var sPageURL = window.location.search.substring(1),
	sURLVariables = sPageURL.split('&'),
	sParameterName,
	i;

	for (i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
		}
	}
};

// https://stackoverflow.com/questions/7342957/how-do-you-round-to-1-decimal-place-in-javascript
function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}