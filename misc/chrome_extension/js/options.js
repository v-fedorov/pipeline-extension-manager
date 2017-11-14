/*global chrome*/


let initOptions = () => {

	let $ = (id) => {
		return document.getElementById(id);
	};

	// helper to get/set a value using a dom id
	let $val = (id, val) => {
		let el = document.getElementById(id);
		if (val !== undefined) {
			el.value = val;
		}
		return el.value;
	};

	let showStatus = () => {
		// Update status to let user know options were saved.
		var status = $('status');
		status.textContent = 'Options saved.';
		setTimeout(() => {
			status.textContent = '';
		}, 750);
	};

	// Saves options to chrome.storage.sync.
	let saveOptions = () => {
		chrome.storage.local.set({
				__publicApiKey: $val('apikey'),
				__searchURL: $val('target')
			},
			showStatus
		);
	};

	// Restores select box and checkbox state using the preferences stored in chrome.storage.
	let restoreOptions = () => {
		// Use default value
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			let data = JSON.parse(xhr.responseText);
			chrome.storage.local.get({
				//Public key with only search enabled
				__publicApiKey: data['apiKey'],
				__searchURL: data['url']
			}, (items) => {
				$val('apikey', items.__publicApiKey);
				$val('target', items.__searchURL);
			});
		};
		xhr.open('GET', '/config/config.json', false);
		xhr.send();
	};

	document.addEventListener('DOMContentLoaded', restoreOptions);
	$('save').addEventListener('click',	saveOptions);

};

initOptions();
