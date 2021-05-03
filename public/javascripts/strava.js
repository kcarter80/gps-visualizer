export async function stravaLogin() {
	// if the user does not have a cookied strava access token, have to go get one
	if (!Cookies.get('strava_access_token')) {
		// no cookie and no code in the url. send them away to strava to login.
		if (!getUrlParameter("code")) {
			window.location.replace("https://www.strava.com/oauth/authorize?client_id=30507&redirect_uri=http%3A%2F%2F" + STRAVA_REDIRECT +"&response_type=code&scope=read,read_all,activity:read,activity:read_all");
		// if this has just come from a redirect from strava, the user will have a code in the url, but no cookie
		} else {
			// TODO: Apps should check which scopes a user has accepted.
			// TODO: Could be an edge case with cookie expiration timing.
			// TODO: Refresh expired access tokens.
			await $.ajax({
				type: "POST",
				url: "https://www.strava.com/oauth/token",
				async: false,
				data: {
					client_id: '30507',
					client_secret: 'd9b48d5c6dd9130562f4023e421a60f0c3ba836e',
					code: getUrlParameter("code"),
					grant_type: 'authorization_code'
				},
				success: function(data) {
					Cookies.set('strava_access_token', data.access_token, { expires: data.expires_in / (60*60*24) })
				},
				error: function() {
					// TODO: are there other edge cases?
					window.location.replace("https://www.strava.com/oauth/authorize?client_id=30507&redirect_uri=http%3A%2F%2F" + STRAVA_REDIRECT +"&response_type=code&scope=read,read_all,activity:read,activity:read_all");
				}
			});

		}
	}

	// we have awaited the ajax call, if it was made
	if (Cookies.get('strava_access_token')) {
		return true;
	} else {
		return false;
	}
}

// doesn't return until the ajax call is complete
export async function getStravaActivities() {
	let activity_data; 
	await $.ajax({
		type: "GET",
		url: "https://www.strava.com/api/v3/activities?per_page=30",
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", "Bearer " + Cookies.get('strava_access_token'));
		},
		success: function(data) {
			activity_data = data;
		}
	});
	return activity_data;
}