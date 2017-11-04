// changed to bitbucket
function removetext() {
	//console.log("Clicked");
	browser.browserAction.setBadgeText({text: ""});
}
browser.browserAction.onClicked.addListener(removetext);

function logURL(requestDetails) {
	// this is mode 1 of download
	var port;
	var title;
	var urlsd;
	function onError(error) {
		console.log(`Error: ${error}`);
	}
	function intercept(tabs) {
		for (let tab of tabs) {
			if (tab.url.search("gaana") != -1){
				urlsd = tab.url;
				let executing = browser.tabs.executeScript(tab.id,{
						file: "getTitle.js"
				});
				// opening the port for communicating with the native app if the 
				// current tab is gaana.com
				port = browser.runtime.connectNative("gaana");

				// change the badge text on start of downloading
				browser.browserAction.setBadgeText({text: "!"});
				browser.browserAction.setPopup({popup:"./popup/downloading.html"});
			}
		}
	}
	var querying = browser.tabs.query({
		active : true,
		currentWindow: true
	});
	querying.then(intercept, onError);

	// opening the port for communicating with the native app 
	//var port = browser.runtime.connectNative("gaana");

	// getting the request cookie for sending with further requests
	var gettingCookie = browser.cookies.get({url: "https://vodhls-vh.akamaihd.net/i/*/*/*/*/*/index_*",name: "hdntl"});
	gettingCookie.then((cookie) => {
		if(cookie){
			browser.runtime.onMessage.addListener(function(message) {
				title = message.title;
			
				// if got the cookie send it to the native app
				console.log(cookie.name);
				console.log(cookie.value);
				console.log(title);
				console.log(urlsd);

				// sending message to the native app
				port.postMessage(cookie.value);
				port.postMessage(requestDetails.url);
				port.postMessage(title);
				port.postMessage(urlsd);
				port.postMessage("1");

				port.onMessage.addListener((response) => {
					console.log("Received: " + response);

					// change the text of popup on downloading completed
					browser.browserAction.setBadgeText({text: "✓"});
					browser.browserAction.setPopup({popup:"./popup/completed.html"});
					// clearing the popup after 4 seconds of completions of downloading
					setTimeout(function() {browser.browserAction.setPopup({popup:""});}, 4000);

					// when download is complete the native app will send message indicating 
					// the completion, then close the port, in turn close the app
					port.disconnect();
				});
			});
		}else{
			console.log("No cookies found!");
		}
	});
}



// catch the browser reqeust for the index file for mode 1 download
browser.webRequest.onBeforeRequest.addListener(
	logURL,
	{urls: ["https://vodhls-vh.akamaihd.net/i/*/*/*/*/*/index_*"]}
);


function getSong(requestDetails) {
	// this is mode 2 of download 
	var port;
	var title;
	var urlsd;
	function onError(error) {
		console.log(`Error: ${error}`);
	}
	function intercept(tabs) {
		for (let tab of tabs) {
			if (tab.url.search("gaana") != -1){
				urlsd = tab.url;
				let executing = browser.tabs.executeScript(tab.id,{
						file: "getTitle.js"
				});
				// opening the port for communicating with the native app if the 
				// current tab is gaana.com
				port = browser.runtime.connectNative("gaana");

				// change the badge text on start of downloading
				browser.browserAction.setBadgeText({text: "!"});
				browser.browserAction.setPopup({popup:"./popup/downloading.html"});
			}
		}
	}
	//query for the active tab to execute the content script and get the title of the currently playing song
	var querying = browser.tabs.query({
		active : true,
		currentWindow: true
	});
	querying.then(intercept, onError);



	browser.runtime.onMessage.addListener(function(message) {
		title = message.title;
		cookie = {name:"", value:""}
		// if got the cookie send it to the native app
		console.log(cookie.name);
		console.log(cookie.value);
		console.log(title);
		console.log(urlsd);
		// sending message to the native app 
		port.postMessage(cookie.value);
		port.postMessage(requestDetails.url);
		port.postMessage(title);
		port.postMessage(urlsd);
		port.postMessage("2");

		port.onMessage.addListener((response) => {
			console.log("Received: " + response);

			// change the text of popup on downloading completed
			browser.browserAction.setBadgeText({text: "✓"});
			browser.browserAction.setPopup({popup:"./popup/completed.html"});
			// clearing the popup after 4 seconds of completions of downloading
			setTimeout(function() {browser.browserAction.setPopup({popup:""});}, 4000);

			// when download is complete the native app will send message indicating 
			// the completion, then close the port, in turn close the app
			port.disconnect();
		});
	});
}

// catching the mode 2 download link
browser.webRequest.onBeforeRequest.addListener(
	getSong,
	{urls: ["https://mn-vzn-prd-hls.musicnet.com/*/*/*/*/*/*/*.mp4.m3u8?*"]}
);