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
			d.innerHTML += `<a href="${url}" download="run_video.webm">Download Video</a>`;
			
			// https://stackoverflow.com/questions/13333378/how-can-javascript-upload-a-blob
			$.ajax({
				type: "POST",
				url: 'https://api.cloudconvert.com/v2/import/upload',
				headers: {
					'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiM2Y5MmFiYTI5NGU5Mzk0ZGQ1OGM0M2Y3NTU0MzI5MDY1NGFjYThhZWRhODk2MmNlOGJlYjE1NDQ5ODcyZDM5YmVhY2U5YTVlY2UwMDE2Y2IiLCJpYXQiOiIxNjEyNzYzODc1Ljg5ODg4NyIsIm5iZiI6IjE2MTI3NjM4NzUuODk4ODkxIiwiZXhwIjoiNDc2ODQzNzQ3NS44NTQzODMiLCJzdWIiOiI0ODY4NTQ2OCIsInNjb3BlcyI6WyJ0YXNrLnJlYWQiLCJ0YXNrLndyaXRlIl19.gGQgg-yWyIJGQ5krMqCVQzsossLTRFmjY0fQPUiiUbNADxRnZG2Qo1PvD5ZNYhHOukR_InYlp7QtFyQealAHU4ZAXKyhz9Cec7IBTU4DF7WQmeVEApTIHDAD5-fgad6d2_ak3fpR7eGYU_4cvfrVRug2Nh2Xz6e4NABHGvOtKwecWc20Ko58GrZ6WDVqOliSt48RDzeUNtLnP_cDUWc89nP8JoQ2AqUVHCr2dEAKIcN4937pz-RmLdXRt-njQQnlcgVK8e3lrQVy3w9Za3OeJ_yDQ-ySIX-sR1_--rtubvUQwMOr3gzo0Xk6H_ra6OKV7bSKObQlXOe9evIBWxjAvmYkCRwiOamWe-697qLl7FWphMX-Nrvg2HM2tZ6fYcQ02sPJM010-aIcY8WVTHQ6L7gg7AyWZujhtrOXAtZvAmMkCbTCw3zE5iskDhfuhhRv9f-w8BKDdHuOsTq3d0r0qjm7P_R13bMjoyUKjEdrYPN5hYR1FNuuBQwmXyr4U8eU8-kHo2U3-YJPdC_0vXm7iaY7uJvwp_uDVhc59w99SrkOu9uSBkju0jFifZVbfsWDs70cps81UFbF6imOMJpROIkcrBc6IMPnuiP7Mis88RzizqdbWy8DNToxPzJ86NCR0FPH3ruU6rB8a82JDV-Ib-RT8HVvPzo_saKqbvK7Nxo',
					'Content-type': 'application/json'
				},
				success: function( data, textStatus, jqXHR ) {
					console.log(data, textStatus, jqXHR);
					var fd = new FormData();
					fd.append('expires',data.data.result.form.parameters.expires);
					fd.append('max_file_count',data.data.result.form.parameters.max_file_count);
					fd.append('max_file_size',data.data.result.form.parameters.max_file_size);
					fd.append('signature',data.data.result.form.parameters.signature);
					fd.append('fname', 'vid.webm');
					fd.append('data', blob);
					$.ajax({
						type: "POST",
						url: data.data.result.form.url,
						headers: {
							'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiM2Y5MmFiYTI5NGU5Mzk0ZGQ1OGM0M2Y3NTU0MzI5MDY1NGFjYThhZWRhODk2MmNlOGJlYjE1NDQ5ODcyZDM5YmVhY2U5YTVlY2UwMDE2Y2IiLCJpYXQiOiIxNjEyNzYzODc1Ljg5ODg4NyIsIm5iZiI6IjE2MTI3NjM4NzUuODk4ODkxIiwiZXhwIjoiNDc2ODQzNzQ3NS44NTQzODMiLCJzdWIiOiI0ODY4NTQ2OCIsInNjb3BlcyI6WyJ0YXNrLnJlYWQiLCJ0YXNrLndyaXRlIl19.gGQgg-yWyIJGQ5krMqCVQzsossLTRFmjY0fQPUiiUbNADxRnZG2Qo1PvD5ZNYhHOukR_InYlp7QtFyQealAHU4ZAXKyhz9Cec7IBTU4DF7WQmeVEApTIHDAD5-fgad6d2_ak3fpR7eGYU_4cvfrVRug2Nh2Xz6e4NABHGvOtKwecWc20Ko58GrZ6WDVqOliSt48RDzeUNtLnP_cDUWc89nP8JoQ2AqUVHCr2dEAKIcN4937pz-RmLdXRt-njQQnlcgVK8e3lrQVy3w9Za3OeJ_yDQ-ySIX-sR1_--rtubvUQwMOr3gzo0Xk6H_ra6OKV7bSKObQlXOe9evIBWxjAvmYkCRwiOamWe-697qLl7FWphMX-Nrvg2HM2tZ6fYcQ02sPJM010-aIcY8WVTHQ6L7gg7AyWZujhtrOXAtZvAmMkCbTCw3zE5iskDhfuhhRv9f-w8BKDdHuOsTq3d0r0qjm7P_R13bMjoyUKjEdrYPN5hYR1FNuuBQwmXyr4U8eU8-kHo2U3-YJPdC_0vXm7iaY7uJvwp_uDVhc59w99SrkOu9uSBkju0jFifZVbfsWDs70cps81UFbF6imOMJpROIkcrBc6IMPnuiP7Mis88RzizqdbWy8DNToxPzJ86NCR0FPH3ruU6rB8a82JDV-Ib-RT8HVvPzo_saKqbvK7Nxo',
							'Content-type': 'application/json'
						},
						data: fd,
						processData: false,
						contentType: false,
						success: function( data, textStatus, jqXHR ) {
							console.log(data, textStatus, jqXHR);
						}
					});
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
	// requests the last N (TODO: look up how many) activities from Strava
	$.ajax({
		type: "GET",
		url: "https://www.strava.com/api/v3/activities?per_page=20",
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", "Bearer " + Cookies.get('strava_access_token'));
		},
		success: function(data) {
			console.log(data);
			
			var $activities = $('activities');
			var activityDate, decodedPolyline;
			for (var i = 0; i < data.length; i++) {
				// only include runs
				if (data[i].type == 'Run') {
					// display the run in the list of activities
					activityDate = new Date(data[i].start_date)
					$('#activities').append(`
						<div>
							<input type="checkbox" id="activity_${data[i].id}" name="selectedActivities" value="${data[i].id}" data-summary-polyline="${data[i].map.summary_polyline}">
							<label for="activity_${data[i].id}">
								${activityDate.toDateString()}
								${activityDate.toTimeString()}
								${data[i].name}
							</label>									
						</div>
					`);
				}
			}	
		}

	});
}

$( document ).ready(function() {
	$( "#button_generate_map" ).click(function() {
		var $selectedActivities = $("input[type='checkbox'][name='selectedActivities']:checked");
		var polylines = [];
		for (var i = 0; i < $selectedActivities.length; i++) {
			polylines.push($selectedActivities[i].dataset.summaryPolyline);
		}
		if (document.getElementById('order').value == 'forward') {
			polylines.reverse();
		}
		drawMap(polylines,parseInt(document.getElementById('duration').value));
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