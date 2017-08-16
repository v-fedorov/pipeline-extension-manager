/*global chrome*/

// Saves options to chrome.storage.sync.
function save_options() {
	let key = document.getElementById('apikey').value;
	let url = document.getElementById('target').value;
	chrome.storage.local.set({
		__publicApiKey: key,
		__searchURL: url
	}, function () {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');
		status.textContent = 'Options saved.';
		setTimeout(function () {
			status.textContent = '';
		}, 750);
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
	// Use default value
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		let data = JSON.parse(xhr.responseText);
		chrome.storage.local.get({
			//Public key with only search enabled
			__publicApiKey: data['apiKey'],
			__searchURL: data['url']
		}, function (items) {
			document.getElementById('apikey').value = items.__publicApiKey;
			document.getElementById('target').value = items.__searchURL;
		});
	};
	xhr.open('GET', '/config/config.json', false);
	xhr.send();
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
	save_options);