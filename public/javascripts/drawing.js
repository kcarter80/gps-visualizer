import loadEncoder from 'https://unpkg.com/mp4-h264@1.0.7/build/mp4-encoder.js'; // WebAssembly mp4 encoder
import {simd} from "https://unpkg.com/wasm-feature-detect?module";

export async function drawMap(polylines,duration,fps) {
	// perceptually different colors generated here: http://vrl.cs.brown.edu/color
	//const colors = ["#3c2d80", "#609111", "#de4a9f", "#048765", "#770c2e", "#308ac9", "#673d17", "#8e41d9", "#b27807", "#657bec"];
	const colors = ["#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000"];
	let map;
	let geoJsons = [];
	// total number of gps points to draw (set by decoded polylines sum)
	let totalPoints = 0;
	// the bounding box for the map
	let minLat = 90;
	let maxLat = -90;
	let minLng = 180;
	let maxLng = -180;
	let decodedPolyline;
	let decodedPolylines = [];
	// finds the bounding box for the map
	for (let i = 0; i < polylines.length; i++) {
		decodedPolyline = polyline.decode(polylines[i]);
		decodedPolylines.push(decodedPolyline);
		totalPoints += decodedPolyline.length;
		for (let ii = 0; ii < decodedPolyline.length; ii++) {
			if (decodedPolyline[ii][0] < minLat) minLat = decodedPolyline[ii][0];
			if (decodedPolyline[ii][0] > maxLat) maxLat = decodedPolyline[ii][0];
			if (decodedPolyline[ii][1] < minLng) minLng = decodedPolyline[ii][1];
			if (decodedPolyline[ii][1] > maxLng) maxLng = decodedPolyline[ii][1];
			decodedPolyline[ii].reverse(); // mapbox wants lng first
		}
	};

	$('#map').show();
	mapboxgl.accessToken = 'pk.eyJ1Ijoia2NhcnRlcjgwIiwiYSI6ImNqb3lna3l4aTJqZHozcHBkb2t6aTlqMXcifQ.ejZI1oT4qSCXozOmgHLYsg';
	map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/streets-v11',
		interactive: false,
		fadeDuration: 0
	});
	/*
	map.on('render', function() {
		console.log('render occured');
	});
	map.on('idle', function() {
		console.log('idle occured');
	});
	map.on('load', function() {
		console.log('load occured');
	});
	map.on('moveend', function() {
		console.log('moveend occured');
	});
	*/
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

	// same as: map.on('load', async function() {
	await new Promise(resolve => map.on('load', resolve));

	for (let i = 0; i < decodedPolylines.length; i++) {
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
	}

	await new Promise(resolve => map.on('idle', resolve));

	// initialize H264 video encoder
	const Encoder = await loadEncoder();
	const gl = map.painter.context.gl; // graphics library
	const width = gl.drawingBufferWidth;
	const height = gl.drawingBufferHeight;
	const encoder = Encoder.create({
		width,
		height,
		fps: fps,
		kbps: 64000,
		rgbFlipY: true
	});		

	let pointsDrawn = 0;
	const totalFrames = (duration - 2000) * fps / 1000;
	const ptr = encoder.getRGBPointer(); // keep a pointer to encoder WebAssembly heap memory

	// reads the pixels from the canvas and places them into the encoder
	function encodeFrame() {
		//console.log('encoding frame')
		// get a view into encoder memory TODO: understand why this is needed
		const pixels = encoder.memory().subarray(ptr);
		// read pixels into encoder
		gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		//console.log(pixels);
		encoder.encodeRGBPointer(); // encode the frame
	}

	async function animate() {
		for(let i = 1; i <= totalFrames; i++) {
			if (i % 30 == 0) status('.');
			// drawFrame awaits the render event from mapbox

			await drawFrame(totalFrames, i, totalPoints, decodedPolylines, geoJsons, map);
			encodeFrame();
		}
	}

	/* I HAVE NO IDEA WHY I NEED THIS */
	// but if i don't include it the first frames are black
	// do all the animations you need to record here
	map.easeTo({
		bearing: map.getBearing(),
		duration: 1,
		easing: t => t
	});
	await new Promise(resolve => map.on('moveend', resolve));
	/* /I HAVE NO IDEA WHY I NEED THIS */

	// create a one second buffer at the beginning of the video	
	for(let i = 1; i <= fps; i++) {
		encodeFrame();
	}

	await animate(); // run all the animations

	for(let i = 1; i <= fps; i++) {
		encodeFrame();
	}

	// download the encoded video file
	const mp4 = encoder.end();
	
	//const anchor = document.createElement("a");
	const blob = new Blob([mp4], {type: "video/mp4"})
	//anchor.href =  URL.createObjectURL(blob);
	//anchor.download = "mapbox-gl";
	//anchor.click();


	const url = URL.createObjectURL(blob);
	$('#video_link').html(`<a href="${url}" download="run_video.mp4">Download video</a>`);
	$('#video_video').prop('src',url);
	$('#step_2').show();
	// TODO: check other browsers
	status(' DONE.<br/><br/>User may now down video or restart ⬇️.');
}
/*
totalFrames: the total number of frames in this animation
thisFrameNumber: the number of this frame
pointsDrawn: how many points have been drawn so far
*/
async function drawFrame(totalFrames, thisFrameNumber, totalPoints, decodedPolylines, geoJsons, map) {
	// no points have been drawn yet on the 0 or 1 frame
	let pointsDrawn;
	if (thisFrameNumber <= 1) {
		pointsDrawn = 0;
	} else {
		pointsDrawn = Math.floor(totalPoints * (thisFrameNumber - 1)/totalFrames);
	}

	// figure out how many points to draw this frame
	let pointsToDraw;
	if (thisFrameNumber == totalFrames) {
		pointsToDraw = totalPoints - pointsDrawn;
	} else {
		const pointsThatWillBeDrawnByNow = Math.floor(totalPoints * thisFrameNumber/totalFrames)
		pointsToDraw = pointsThatWillBeDrawnByNow - pointsDrawn;
	}

	//console.log(pointsDrawn, pointsToDraw);
	// don't need to do anything in this case
	if (pointsToDraw == 0) return;

	let lengthsSum = 0; // sum of the lengths of polylines already drawn
	let i = 0;          // polyline index
	let leftoverPoints; // the points leftover after previous polylines accounted for
	let theSlice;       // the polyline points on this iteration to add to the geoJsons
	while (i < decodedPolylines.length && pointsToDraw > 0) {
		leftoverPoints = pointsDrawn - lengthsSum;
		// this means this polyline has already been fully drawn
		if (leftoverPoints - decodedPolylines[i].length >= 0) {
			// move on to next, increment lengths sum
			lengthsSum += decodedPolylines[i].length;
			i++;
		// we're missing at least some (and maybe all) of this segment
		} else {
			if (decodedPolylines[i].length - leftoverPoints > pointsToDraw) {
				// all the remaining points to draw can be drawn from this polyline without using all of the polyline
				theSlice = decodedPolylines[i].slice(leftoverPoints,leftoverPoints + pointsToDraw);
				geoJsons[i].features[0].geometry.coordinates.push(...theSlice);
				map.getSource('route-' + i).setData(geoJsons[i]);
				pointsDrawn += pointsToDraw;
				pointsToDraw = 0;
			} else {
				// can use everything in this polyline (and perhaps some of the next, which we'll check on next loop)
				theSlice = decodedPolylines[i].slice(leftoverPoints);
				geoJsons[i].features[0].geometry.coordinates.push(...theSlice);
				map.getSource('route-' + i).setData(geoJsons[i]);
				pointsDrawn += decodedPolylines[i].length - leftoverPoints;
				pointsToDraw -= decodedPolylines[i].length - leftoverPoints;
				lengthsSum += decodedPolylines[i].length;
				i++;
			}
		}
	}
	// important: do not return until render is complete and map reports idle
	await new Promise(resolve => map.once('idle', resolve));
}

function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
