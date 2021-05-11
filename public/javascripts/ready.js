import {stravaLogin, getStravaActivities} from "./strava.js";

export async function ready() {
	status('Checking Strava login.');
	if (await stravaLogin()) {
		status(' ✅<br/> Loading Strava activities.');
		const activity_data = await getStravaActivities();
		//console.log(activity_data);
		status(' ✅<br/>');
		
		const date_options = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' };
		const time_options = {hour: '2-digit', minute: '2-digit', second: '2-digit'}
		let activity_date;
		for (let i = 0; i < activity_data.length; i++) {
			// only include runs
			//if (data[i].type == 'Run') {
				if (activity_data[i].map.summary_polyline) {
					activity_date = new Date(activity_data[i].start_date);
					$('#activities').append(`
						<div>
							<input type="checkbox" id="activity_${activity_data[i].id}" name="selected_activities" value="${activity_data[i].id}" data-summary-polyline="${activity_data[i].map.summary_polyline}">
							<label for="activity_${activity_data[i].id}">
								${activity_date.toLocaleDateString(undefined, date_options)}
								${activity_date.toLocaleTimeString(undefined, time_options)}
								${activity_data[i].name}
								${round(activity_data[i].distance * 0.000621371,1)} mi
							</label>									
						</div>
					`);
				}
			//}
		}
		status('<br/>Please select activities and generate animation. ⬇️');		
	} else {
		status('Not logged in to Strava.<br/>');
	};
}