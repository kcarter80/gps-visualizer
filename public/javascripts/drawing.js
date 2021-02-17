// perceptually different colors generated here: http://vrl.cs.brown.edu/color
//var colors = ["#3c2d80", "#609111", "#de4a9f", "#048765", "#770c2e", "#308ac9", "#673d17", "#8e41d9", "#b27807", "#657bec"];
var colors = ["#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000"];
var map;

function drawMap(polylines,duration) {
	var geoJsons = [];
	// total number of gps points to draw
	var totalPoints = 0;
	var animationStart, frameStart, lastFrameStart;
	var animationDelay = 50;
	var animationTime = duration * 1000;
	var pointsDrawn = 0;
	// the bounding box for the map
	var minLat = 90;
	var maxLat = -90;
	var minLng = 180;
	var maxLng = -180;
	var decodedPolyline;
	var decodedPolylines = [];
	for (var i = 0; i < polylines.length; i++) {
		decodedPolyline = polyline.decode(polylines[i]);
		decodedPolylines.push(decodedPolyline);
		totalPoints += decodedPolyline.length;
		for (var ii = 0; ii < decodedPolyline.length; ii++) {
			if (decodedPolyline[ii][0] < minLat) minLat = decodedPolyline[ii][0];
			if (decodedPolyline[ii][0] > maxLat) maxLat = decodedPolyline[ii][0];
			if (decodedPolyline[ii][1] < minLng) minLng = decodedPolyline[ii][1];
			if (decodedPolyline[ii][1] > maxLng) maxLng = decodedPolyline[ii][1];
			decodedPolyline[ii].reverse(); // mapbox wants lng first
		}
	};
	console.log(totalPoints,decodedPolylines);

	$('#map').show();
	mapboxgl.accessToken = 'pk.eyJ1Ijoia2NhcnRlcjgwIiwiYSI6ImNqb3lna3l4aTJqZHozcHBkb2t6aTlqMXcifQ.ejZI1oT4qSCXozOmgHLYsg';
	map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/streets-v11'
	});
	map.fitBounds([
			[minLng,minLat],
			[maxLng,maxLat]
		],
		// the padding makes the map a little less cut close at the edges
		{
			duration: 0,
			padding: 20
		}
	);

	map.on('load', function() {
		const d = document.getElementById('video_link');
		const canvas = document.querySelector('.mapboxgl-canvas');
		// Optional frames per second argument.
		const stream = canvas.captureStream(20);
		var mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
		const chunks = [];
		mr.ondataavailable = function(e) {
			chunks.push(e.data);
		};
		mr.onstop = (e) => {
			const blob = new Blob(chunks, {
				type: "video/webm"
			});
			const url = URL.createObjectURL(blob);
			d.innerHTML = `<a href="${url}" download="run_video.webm">Download Video</a>`;

			$.ajax({
				type: "GET",
				url: '/create_upload_task',
				success: function( data, textStatus, jqXHR ) {
					console.log('Upload task created', data, textStatus, jqXHR);
					
					var fd = new FormData();					
					for (const [key, value] of Object.entries(data.data.result.form.parameters)) {
						fd.append(key,value);
					}
					// https://stackoverflow.com/questions/13333378/how-can-javascript-upload-a-blob
					// fd.append('fname', 'vid.webm');
					fd.append('file', blob);
					$.ajax({
						type: "POST",
						url: data.data.result.form.url,
						data: fd,
						// the following 2 attributes are needed to get the blob upload to work
						processData: false,
						contentType: false,
						success: function( data, textStatus, jqXHR ) {
							console.log('Blob uploaded', data, textStatus, jqXHR);
							$.ajax({
								type: "POST",
								url: '/create_convert_and_export_job',
								data: {
									upload_task_id: data.getElementsByTagName('Key')[0].innerHTML.slice(0,-5),
									input_format: 'webm',
									output_format: 'mp4'
								},
								success: function( data, textStatus, jqXHR ) {
									console.log('File conversion begun', data, textStatus, jqXHR);
								}
							});
						}
					})
				}
			});
		};
		for (var i = 0; i < decodedPolylines.length; i++) {
			geoJsons[i] = {
				'type': 'FeatureCollection',
				'features': [
				{
					'type': 'Feature',
					'geometry': {
						'type': 'LineString',
						'coordinates': []
					}
				}
				]
			};

			map.addSource('route-' + i, {
				type: 'geojson',
				data: geoJsons[i]
			});
			map.addLayer({
				'id': 'route-animation-' + i,
				'type': 'line',
				'source': 'route-' + i,
				'layout': {
					'line-join': 'round',
					'line-cap': 'round'
				},
				'paint': {
					'line-opacity': 0.3,
					'line-color': colors[i],
					'line-width': 4
				}
			});
			var k = 0;
		}

		mr.start();
		animationStart = frameStart = performance.now();
		
		var timerId = setTimeout(function draw() {
			lastFrameStart = frameStart;
			frameStart = performance.now();
			var elapsedTime = frameStart - animationStart;
			var pointsToDraw;
			// if this isn't the final frame
			if (elapsedTime < animationTime) {
				var pointsThatShouldBeDrawnByNow = Math.floor(totalPoints * elapsedTime / animationTime);
				$('#distance').html((10.23 * elapsedTime / animationTime).toFixed(2));
				pointsToDraw = pointsThatShouldBeDrawnByNow - pointsDrawn;
			} else {
				pointsToDraw = totalPoints - pointsDrawn;
				$('#distance').html(10.23);
				mr.stop();
			}
			var lengthsSum = 0;
			var i = 0;
			while (i < decodedPolylines.length && pointsToDraw > 0) {
				// pointsDrawn - points drawn so far
				// lengthsSum  - sum of lengths of segments looped through
				// decodedPolylines[i].length - length of this segment
				var alreadyDrawnPointsThisPolyline = pointsDrawn - lengthsSum;
				if (alreadyDrawnPointsThisPolyline - decodedPolylines[i].length >= 0) {
					// move on to next, increment lengths sum
					lengthsSum += decodedPolylines[i].length;
					i++;
				// points drawn is missing at least some of this segment
				} else {
					if (decodedPolylines[i].length - alreadyDrawnPointsThisPolyline > pointsToDraw) {
						// all the points can be drawn from this polyline
						var theSlice = decodedPolylines[i].slice(alreadyDrawnPointsThisPolyline,alreadyDrawnPointsThisPolyline + pointsToDraw);
						geoJsons[i].features[0].geometry.coordinates.push(...theSlice);
						map.getSource('route-' + i).setData(geoJsons[i]);
						pointsDrawn += pointsToDraw;
						pointsToDraw = 0;
					} else {
						// need to take everything left in this polyline
						var theSlice = decodedPolylines[i].slice(alreadyDrawnPointsThisPolyline);
						// not specifying an end in slice gets the remainder
						geoJsons[i].features[0].geometry.coordinates.push(...theSlice);
						map.getSource('route-' + i).setData(geoJsons[i]);
						pointsDrawn += decodedPolylines[i].length - alreadyDrawnPointsThisPolyline;
						pointsToDraw -= decodedPolylines[i].length - alreadyDrawnPointsThisPolyline;
						lengthsSum += decodedPolylines[i].length;
						i++;
					}								
				}
			}
			// need to keep going
			if (elapsedTime < animationTime) {
				timerId = setTimeout(draw, animationDelay);
			}
		}, animationDelay);				
	});
}

function getStravaActivities() {
	var $activities = $('#activities');
	var $status = $('#status');
	$status.append('<div id="status_loading_strava_activities">Loading Strava activities.</div>');
	// requests the last N (TODO: look up how many) activities from Strava
	$.ajax({
		type: "GET",
		url: "https://www.strava.com/api/v3/activities?per_page=30",
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", "Bearer " + Cookies.get('strava_access_token'));
		},
		success: function(data) {
			$('#status_loading_strava_activities').append(' DONE.');
			var dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' };
			var timeOptions = {hour: '2-digit', minute: '2-digit', second: '2-digit'}
			var activityDate, decodedPolyline;
			for (var i = 0; i < data.length; i++) {
				// only include runs
				if (data[i].type == 'Run') {
					// display the run in the list of activities
					activityDate = new Date(data[i].start_date)
					console.log(data[i]);
					$('#activities').append(`
						<div>
							<input type="checkbox" id="activity_${data[i].id}" name="selected_activities" value="${data[i].id}" data-summary-polyline="${data[i].map.summary_polyline}">
							<label for="activity_${data[i].id}">
								${activityDate.toLocaleDateString(undefined, dateOptions)}
								${activityDate.toLocaleTimeString(undefined, timeOptions)}
								${data[i].name}
								${round(data[i].distance * 0.000621371,1)} mi
							</label>									
						</div>
					`);
				}
			}	
		}

	});
}

$( document ).ready(function() {
	$( "#button_show_video" ).click(function() {
		var $selected_activities = $("input[type='checkbox'][name='selected_activities']:checked");
		var polylines = [];
		for (var i = 0; i < $selected_activities.length; i++) {
			polylines.push($selected_activities[i].dataset.summaryPolyline);
		}
		if (document.getElementById('order').value == 'forward') {
			polylines.reverse();
		}
		drawMap(polylines,parseInt(document.getElementById('duration').value));
	});

	// shows and hides the order drop down and generate button if appropriate
	$('#activities').on('click', 'input', function() {
		const activities_selected = $("#activities input:checked").length;
		if ( activities_selected > 1 ) {
			$('#run_display_order').show();
		} else {
			$('#run_display_order').hide();
		}
		if ( activities_selected > 0 ) {
			$( "#button_show_video" ).prop('disabled',false);
		} else {
			$( "#button_show_video" ).prop('disabled', true );
		}
	});

	if (!Cookies.get('strava_access_token')) {
		if (!getUrlParameter("code")) {
			window.location.replace("https://www.strava.com/oauth/authorize?client_id=30507&redirect_uri=http%3A%2F%2F" + STRAVA_REDIRECT +"&response_type=code&scope=read,read_all,activity:read,activity:read_all");
		} else {
			// TODO: Apps should check which scopes a user has accepted.
			// TODO: Could be an edge case with cookie expiration timing.
			// TODO: Refresh expired access tokens.
			$.ajax({
				type: "POST",
				url: "https://www.strava.com/oauth/token",
				data: {
					client_id: '30507',
					client_secret: 'd9b48d5c6dd9130562f4023e421a60f0c3ba836e',
					code: getUrlParameter("code"),
					grant_type: 'authorization_code'
				},
				success: function(data) {
					Cookies.set('strava_access_token', data.access_token, { expires: data.expires_in / (60*60*24) })
					getStravaActivities();
				},
				error: function() {
					console.log('Something went wrong with authorization.');
				}
			});
		}
	} else {
		getStravaActivities();
	}
});