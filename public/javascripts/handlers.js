import {drawMap} from "/javascripts/drawing.js";

export function handlers() {
	const $activities = $('#activities'); // the list of strava activities

	// forces status to always be scrolled to bottom
	// convenient when new status is added
	const $status = $('#status');
	$status.on('DOMSubtreeModified', function(){
		$status.scrollTop($status[0].scrollHeight);
	});

	// CLICK HANDLERS //
	$( "#button_generate_animation" ).click(async function() {
		$('#step_1').hide();
		status(' DONE.<br/>Generating animation.');

		// collates the selected activities into an array of polylines
		const $selected_activities = $("input[type='checkbox'][name='selected_activities']:checked");
		let polylines = [];
		for (let i = 0; i < $selected_activities.length; i++) {
			polylines.push($selected_activities[i].dataset.summaryPolyline);
		}
		if (document.getElementById('order').value == 'forward') {
			polylines.reverse();
		}
		// last argument is the frames per second
		drawMap(polylines,parseInt(document.getElementById('duration').value) * 1000,30);
	});

	// shows and hides the order drop down and generate button if appropriate
	$activities.on('click', 'input', function() {
		const activities_selected = $("#activities input:checked").length;
		if ( activities_selected > 1 ) {
			$('#run_display_order').show();
		} else {
			$('#run_display_order').hide();
		}
		if ( activities_selected > 0 ) {
			$( "#button_generate_animation" ).prop('disabled',false);
		} else {
			$( "#button_generate_animation" ).prop('disabled', true );
		}
	});

	$( "#restart" ).click(function() {
		$('#step_2').hide();
		$('#video_link, #map').empty();
		$('#step_1').show();		
		status(' DONE.<br/><br/>Waiting for user to select activities ➡️ and to generate animation ⬇️.');
	});
	// END CLICK HANDLERS
};