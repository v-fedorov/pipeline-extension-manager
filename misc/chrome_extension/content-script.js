'use strict';
//The global timeout variable for the addToPage()
var addTimeOut;
//The api key
var apiKey;
//The url of the cloud platform
var url;
//Add button delay for the test buttons
var addTestButtonDelay;










/*
 *	EXTENSION GALLERY
 *
 */


/**
 * Sets up the javascript for the modal
 * 
 */
function setupExtensionGalleryModal() {

	let svgButtonHTML = `
	<svg height='18' width='18' style='
	    position: absolute;
	    top:50%;
	    transform:translate(-50%, -50%);
	'>
		<polygon points='0,0 0,18 18,9' style='fill:#f58020;'></polygon>
		Search
	</svg>
	`;

	$('#__search > div.coveo-search-section > div > a').html(svgButtonHTML);

	// Get the modal
	let modal = $('#__extensionsGalleryModal');

	// Get the <span> element that closes the modal
	let span = $('.__close');

	// When the user clicks the button, open the modal 
	$('#__modalButton').on('click', function () {
		modal.css('display', 'block');
	});

	// When the user clicks on <span> (x), close the modal
	for (var i = 0; i < span.length; i++) {
		var element = span[i];
		$(element).on('click', function () {
			modal.css('display', 'none');
		});
	}

	// When the user clicks anywhere outside of the modal, close it
	modal.on('click', function (event) {
		if (event.target == modal[0]) {
			modal.css('display', 'none');
		}
	});

}


/**
 * The onclick function for the extension search result link
 * 
 * @param {event} e - The event
 * @param {object} result - The search result
 */
function extensionGalleryOnClick(e, result) {
	let title = result.title;
	let description = result.raw.extdescription;
	let reqData = result.raw.extrequired;
	let uniqueId = result.uniqueId;

	setAceEditorValue('');
	$('#BodyTextDataStream').attr('checked', false);
	$('#BodyHTMLDataStream').attr('checked', false);
	$('#ThumbnailDataStream').attr('checked', false);
	$('#FileBinaryStream').attr('checked', false);
	$('#ExtensionName').val('');
	$('#ExtensionDescription').val('');

	if (uniqueId) {
		$.get(`${url}/rest/search/v2/html?organizationId=extensions&uniqueId=${uniqueId}&access_token=${apiKey}`,
			function (data) {
				setAceEditorValue($(data).contents()[4].innerHTML);
			}
		)
	}
	if (title) {
		$('#ExtensionName').val(title)
	}
	if (description) {
		$('#ExtensionDescription').val(description);
	}
	if (reqData) {
		reqData.split(';').forEach(function (element) {
			element === 'Body text' ? $('#BodyTextDataStream').attr('checked', true) : false;
			element === 'Body HTML' ? $('#BodyHTMLDataStream').attr('checked', true) : false;
			element === 'Thumbnail' ? $('#ThumbnailDataStream').attr('checked', true) : false;
			element === 'Original file' ? $('#FileBinaryStream').attr('checked', true) : false;
		}, this);
	}
	$('#__extensionsGalleryModal').css('display', 'none');
}


/**
 * Creates the modal componant of the page along with the button
 * 
 */
function createExtensionGalleryModal() {
	let editorElement = $('#EditExtensionComponent > div > div > form > div:nth-child(2)')[0];
	//Get the HTML data
	$.get(chrome.extension.getURL('/html/extension-search.html'), function (data) {
		let containerDiv = document.createElement('div');
		containerDiv.innerHTML = data;
		editorElement.insertBefore(containerDiv, editorElement.childNodes[0]);

		//Init the Coveo search
		var root = document.getElementById('__search');
		Coveo.SearchEndpoint.endpoints['extensions'] = new Coveo.SearchEndpoint({
			restUri: `${url}/rest/search`,
			accessToken: apiKey
		});
		Coveo.init(root, {
			ResultLink: {
				onClick: function (e, result) {
					e.preventDefault();
					extensionGalleryOnClick(e, result);
				}
			}
		});

		setupExtensionGalleryModal();
	});
}


/**
 * Adds the select with options to the page
 * after 350 ms the edit modal started appearing
 * 
 */
function addExtensionSearchToPage() {
	if (addTimeOut) {
		clearTimeout(addTimeOut);
	}
	addTimeOut = setTimeout(function () {
		//If its opening
		if ($('#EditExtensionComponent').length && !$('#__modalButton')[0]) {
			createExtensionGalleryModal();
		}
	}, 350);
}













/* 
 * EXTENSION TESTER
 * 
 */


/**
 * The onclick for the test button
 * 
 * @param {object} element - The row element
 */
function testButtonsOnClick(element) {
	let extId = $('.extension-name .second-row', element).text().trim();
	$('#__tab1').click();
	$('#__testDocId').val('');
	launchTestModal(extId);
}


/**
 * Opens the testing modal with the specific extension to test
 * 
 * @param {string} extensionId - The extension id
 */
function launchTestModal(extensionId) {
	let modal = document.getElementById('__contentModal');
	modal.style.display = 'block';
	$('#__currentExtension').text(extensionId);
}


/**
 * Add test modal to page
 * 
 */
function addTestModal() {
	$.get(chrome.extension.getURL('/html/content-search.html'), function (data) {
		$('#extensions').append(data);

		$('#__runTests').click(runTest);
		$('#__saveSettings').on('click', saveTestsKey);

		let jsonToGet = {};
		let currentOrg = $('#OrganizationsPickerSearch_chosen > a > span').text().split('-').pop().trim();
		let platform = location.host.split('.')[0];
		jsonToGet[`__testsApiKey_${currentOrg}_${platform}`] = '';
		//Get the API key
		chrome.storage.local.get(jsonToGet, function (items) {
			//Set it for later
			let testApiKey = items[`__testsApiKey_${currentOrg}_${platform}`];
			$('#__testApiKey').val(testApiKey);
			if (testApiKey == '' || testApiKey == undefined) {
				$('#__apiKeyWarning').css('display', 'block');
			}

			let modal = document.getElementById('__contentModal');
			let span = document.getElementsByClassName('__close');

			for (var i = 0; i < span.length; i++) {
				var element = span[i];
				element.onclick = function () {
					modal.style.display = 'none';
				}
			}

			modal.onclick = function (event) {
				if (event.target == modal) {
					modal.style.display = 'none';
				}
			}

			let root = document.getElementById('__orgContent');
			Coveo.SearchEndpoint.endpoints['orgContent'] = new Coveo.SearchEndpoint({
				restUri: `https://${location.host}/rest/search`,
				accessToken: testApiKey
			});
			Coveo.init(root, {
				ResultLink: {
					onClick: function (e, result) {
						e.preventDefault();
						$('#__testDocId').val(result.uniqueId);
						$('#__tab2').click();
						$('#__runTests').click();
					}
				}
			});
		});


	});
}


/**
 * Runs the extension test
 * 
 */
function runTest() {
	//Show the loading bubbles
	let loadingElement = $('#__testLoading');
	loadingElement.css('display', 'block');

	$('#__testResults').text('');
	let apiTestsKey = $('#__testApiKey').val();
	let currentOrg = $('#OrganizationsPickerSearch_chosen > a > span').text().split('-').pop().trim();
	let extensionId = $('#__currentExtension').text();
	let uniqueId = $('#__testDocId').val();
	let testUrl = `https://${location.host}/rest/organizations/${currentOrg}/extensions/${extensionId}/test`;
	let documentUrl = `https://${location.host}/rest/search/document?uniqueId=${encodeURIComponent(uniqueId)}&access_token=${apiTestsKey}&organizationId=${currentOrg}`;
	let extensionSettingsUrl = `https://${location.host}/rest/organizations/${currentOrg}/extensions/${extensionId}`;
	let errorBannerElement = $('#__extensionTesterErrors');
	errorBannerElement.empty();
	var toSendData = {
		"document": {
			"permissions": [],
			"metadata": [
				{
					"Values": {

					},
					"origin": "Extension tester"
				}
			],
			"dataStreams": [
				{
					"Values": {

					},
					"origin": "Extension tester"
				}
			],
		},
		"parameters": {}
	}

	//The ajax requests to run sync
	let requests = [];
	//When all of these are true, fire the extension test
	//Each will be set to true when it finishes the async
	let requestsReady = [false, false, false, false];
	$.ajax({
		url: extensionSettingsUrl,
		headers: {
			'Authorization': `Bearer ${apiTestsKey}`,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		method: 'GET',
		dataType: 'json',
		complete: function () {
			let counter = 0;
			let displayedError = false;
			function wait() {
				//Wait until all true
				if (requestsReady.every(function (e) { return e })) {
					runTestAjax();
				}
				else {
					counter++;
					if (counter > 500 && !displayedError) {
						addError('Something might have gone wrong, check the console for errors');
						displayedError = true;
					}
					setTimeout(wait, 100);
				}
			}
			wait();
		},
		error: function (data) {
			addError('Failed to fetch extension, stopping');
			loadingElement.css('display', 'none');
		}
	}).done(function (data) {
		//Adds the metadata that the extension requires
		if (data.requiredDataStreams) {
			if ($.inArray('BODY_TEXT', data.requiredDataStreams) != -1) {
				requests.push(setBodyText());
			}
			else {
				requestsReady[0] = true;
			}

			if ($.inArray('BODY_HTML', data.requiredDataStreams) != -1) {
				requests.push(setBodyHTML());
			}
			else {
				requestsReady[1] = true;
			}

			if ($.inArray('THUMBNAIL', data.requiredDataStreams) != -1) {
				//requests.push(setThumbnail());
				addWarning('"Thumbnail" was called by the extension, but it is unavailable')
				requestsReady[2] = true;
			}
			else {
				requestsReady[2] = true;
			}

			if ($.inArray('DOCUMENT_DATA', data.requiredDataStreams) != -1) {
				addWarning('"Orignal file" was called by the extension, but it is unavailable')
			}
		}
		requests.push(setDocumentMetadata());
	});


	/**
	 * Adds the Body Text data to the data to send
	 * 
	 * @returns The ajax request
	 */
	function setBodyText() {
		return $.ajax({
			url: `https://${location.host}/rest/search/text?access_token=${apiTestsKey}&organizationId=${currentOrg}&uniqueId=${encodeURIComponent(uniqueId)}`,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			method: 'GET',
			dataType: 'json',
			success: function (data) {
				if (data.content) {
					//If it find no statusCode, meaning it was successful
					if (!data.status) {
						toSendData.document.dataStreams[0].Values['BODY_TEXT'] = {
							'inlineContent': btoa(unicodeEscape(data.content)),
							'compression': 'UNCOMPRESSED'
						}
					}
					else {
						addError('Extension called for "Body text", but no Body Text exists for this document');
					}
				}
			},
			error: function (data) {
				addError('Extension called for "Body text", but no Body Text exists for this document');
			},
			complete: function (data) {
				requestsReady[0] = true;
			}
		})
	}


	/**
	 * Adds the HTML data to the data to send
	 * 
	 * @returns The ajax request
	 */
	function setBodyHTML() {
		return $.ajax({
			url: `https://${location.host}/rest/search/html?access_token=${apiTestsKey}&organizationId=${currentOrg}&uniqueId=${encodeURIComponent(uniqueId)}`,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			method: 'GET',
			dataType: 'html',
			success: function (data) {
				if (data) {
					//If it find no statusCode, meaning it was successful
					if (!data.status) {
						toSendData.document.dataStreams[0].Values['BODY_HTML'] = {
							'inlineContent': btoa(unicodeEscape(data)),
							'compression': 'UNCOMPRESSED'
						}
					}
					else {
						addError('Extension called for "Body HTML", but no Body HTML exists for this document');
					}
				}
			},
			error: function (data) {
				addError('Extension called for "Body HTML", but no Body HTML exists for this document');
			},
			complete: function (data) {
				requestsReady[1] = true;
			}
		})
	}


	/**
	 * Turn off for now
	 * Adds the Thumbnail data to the data to send
	 * 
	 * @returns The ajax request
	 */
	function setThumbnail() {
		return $.ajax({
			url: `https://${location.host}/rest/search/datastream?access_token=${apiTestsKey}&organizationId=${currentOrg}&contentType=application%2Fbinary&dataStream=%24Thumbnail%24&uniqueId=${encodeURIComponent(uniqueId)}`,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			method: 'GET',
			success: function (data) {
				if (data) {
					//If it find no statusCode, meaning it was successful
					if (!data.status) {
						toSendData.document.dataStreams[0].Values['THUMBNAIL'] = {
							'inlineContent': '',
							'compression': 'UNCOMPRESSED'
						}
					}
					else {
						addError('Extension called for "Thumbnail", but no Thumbnail exists for this document');
					}
				}
			},
			error: function (data) {
				addError('Extension called for "Thumbnail", but no Thumbnail exists for this document');
			},
			complete: function (data) {
				requestsReady[2] = true;
			}
		})
	}


	/**
	 * Adds the metadata of the document to test to the data to send
	 * 
	 * @returns The ajax request
	 */
	function setDocumentMetadata() {
		//Get the document metadata
		return $.ajax({
			url: documentUrl,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			method: 'GET',
			dataType: 'json',
			success: function (data) {
				//StatusCode would mean an error
				if ('statusCode' in data) {
					$('#__testResults').text('Failed to fetch document\n' + JSON.stringify(data, null, 2));
					loadingElement.css('display', 'none');
				}
				else {
					//Build the document metadata

					function addToJson(valueToAdd, addKey) {
						if (valueToAdd != null) {
							if (valueToAdd.length != 0) {
								if (valueToAdd.constructor === Array) {
									toSendData.document.metadata[0].Values[addKey] = valueToAdd;
								}
								else if (valueToAdd.constructor === Object) {
									for (let ckey in valueToAdd) {
										addToJson(valueToAdd[ckey], ckey);
									}
								}
								else {
									toSendData.document.metadata[0].Values[addKey] = [valueToAdd];
								}
							}
						}
					}
					addToJson(data);
				}
			},
			error: function (data) {
				//$('#__testResults').text(JSON.stringify(data.responseJSON, null, 2));
				addError('Failed to fetch document metadata');
			},
			complete: function (data) {
				requestsReady[3] = true;
			}
		})
	}


	/**
	 * Sends the ajax request to the extension tester with
	 * all the metadata added
	 * 
	 */
	function runTestAjax() {
		$.ajax({
			url: testUrl,
			headers: {
				'Authorization': `Bearer ${apiTestsKey}`,
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			method: 'POST',
			dataType: 'json',
			data: JSON.stringify(toSendData, null, 0),
			complete: function (data) {
				$('#__testResults').text(JSON.stringify(data.responseJSON, null, 2));
				loadingElement.css('display', 'none');
			}
		});
	}


	/**
	 * Add an error message to the test
	 * 
	 * @param {string} str - The error message
	 */
	function addError(str) {
		let message =
			`
		<div class='banner flex center-align bg-red'>
			<div class="banner-description">
				<p>${str}</p>
			</div>
		</div>
		`;
		errorBannerElement.append(message);
	}


	/**
	 * Add a warning message to the test
	 * 
	 * @param {string} str - The warning message
	 */
	function addWarning(str) {
		let message =
			`
		<div class='banner flex center-align bg-yellow'>
			<div class="banner-description">
				<p>${str}</p>
			</div>
		</div>
		`;
		errorBannerElement.append(message);
	}
}


/**
 * Adds the Test buttons in the table of the extensions
 * 
 */
function addTestButtonsToPage() {
	//Do this first, since it will be called multiple times
	//before the async function is done below
	//This is to ensure we don't get multiple columns
	$('#extensions').attr('__modified', true);
	$.get(chrome.extension.getURL('/html/extension-test-button.html'), function (data) {
		if ($('#__testHeader').length == 0) {
			$($('#extensions')[0].children[0].children[0]).append('<th id="__testHeader">Tests</th>');
		}
		for (let i = 0; i < $('#extensions')[0].children[1].children.length; i++) {
			let element = $('#extensions')[0].children[1].children[i];
			//If a button is not found and there is an extension present
			if ($(element).find('.btn').length == 0 && !$(element).hasClass('empty')) {
				$(element).append(data);
				$(element).find('.btn').on('click', function () {
					testButtonsOnClick(element);
				});
			}
			//Changes the length of "No extensions found" TD when found to occupy space of "Tests" TH
			//Makes it look better basicly
			else if ($(element).hasClass('empty')) {
				let tdElement = $(element).find('td');
				tdElement.attr('colspan', tdElement.attr('colspan') + 1);
			}
		}
	});
}


/**
 * Saves the test api key to the chrome storage
 * 
 */
function saveTestsKey() {
	let jsonToSave = {};
	let currentOrg = $('#OrganizationsPickerSearch_chosen > a > span').text().split('-').pop().trim();
	let platform = location.host.split('.')[0];
	jsonToSave[`__testsApiKey_${currentOrg}_${platform}`] = $('#__testApiKey').val();
	chrome.storage.local.set(jsonToSave, function () {
		location.reload();
	});
}










/*
 * OTHER
 * 
 */


/**
 * The 'init' function of the script
 * Loads the values from the config and inits the mutation obs
 * 
 */
window.onload = function () {

	//Default values if no values are found
	chrome.storage.local.get({
		// Public key with only search enabled
		__publicApiKey: 'xx0b957ee7-8846-4b6c-b4c3-6f88362e601f',
		__searchURL: 'https://platformqa.cloud.coveo.com/'
	}, function (items) {
		apiKey = items.__publicApiKey;
		url = items.__searchURL;

		//Checks if there were changes on the page
		MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

		var observer = new MutationObserver(function (mutations, observer) {
			// If the EditExtensionComponent appears
			if ($('#EditExtensionComponent').length) {
				addExtensionSearchToPage();
			}

			// If extensions appears AND it wasn't already modified by this script
			if ($('#extensions').length && !$('#extensions').attr('__modified')) {

				if (addTestButtonDelay) {
					clearTimeout(addTestButtonDelay);
				}
				addTestButtonDelay = setTimeout(function () {
					addTestButtonsToPage();
					addTestModal();

					//If a row is added later on, add the buttons
					$('#extensions').on("DOMNodeInserted", "tr", function () {
						addTestButtonsToPage();
					});
				}, 100);
			}
		});

		// define what element should be observed by the observer
		// and what types of mutations trigger the callback
		observer.observe(document, {
			subtree: true,
			attributes: true
		});
	});
};

/**
 * Sets the value of the ace editor by injecting JS into the main page
 * WHY JS, WHY
 * but it works...
 * https://stackoverflow.com/questions/3955803/page-variables-in-content-script
 * 
 * @param {string} stringToSet - The string to set
 */
function setAceEditorValue(stringToSet) {

	var scriptContent = `window.ace.edit('AceCodeEditor').setValue(\`${stringToSet}\`)`;

	var script = document.createElement('script');
	script.id = 'tmpScript';
	script.appendChild(document.createTextNode(scriptContent));
	(document.body || document.head || document.documentElement).appendChild(script);

	$('#tmpScript').remove();

}


/**
 * Converts a UTF-8 string into UTF-16LE
 * while staying in a UTF-8 context
 * 
 * Inspired from
 * https://gist.github.com/mathiasbynens/1243213
 * 
 * @param {string} str - The string to convert 
 * @returns The UTF-16LE string
 */
function unicodeEscape(str) {
	return str.replace(/[\s\S]/g, function (escape) {
		let code = ('0000' + escape.charCodeAt().toString(16)).slice(-4);
		code = hex2a(code.substr(2, 2) + code.substr(0, 2));
		return code;
	});
}


/**
 * Converts hex to ascii
 * https://stackoverflow.com/questions/3745666/how-to-convert-from-hex-to-ascii-in-javascript
 * 
 * @param {string} hexx - the hex 
 * @returns ascii value
 */
function hex2a(hexx) {
	var hex = hexx.toString();//force conversion
	var str = '';
	for (var i = 0; i < hex.length; i += 2)
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	return str;
}