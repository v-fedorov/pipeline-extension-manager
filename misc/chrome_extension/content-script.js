'use strict';
// jshint -W110
/*global chrome, Coveo*/

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

	let svgButtonHTML = `<svg height='18' width='18' style='position: absolute; top:50%; transform:translate(-50%, -50%);'>
			<polygon points='0,0 0,18 18,9' style='fill:#f58020;'></polygon>
			Search
		</svg>`;

	$('#__search > div.coveo-search-section > div > a').html(svgButtonHTML);

	// Get the modal
	let modal = $('#__extensionsGalleryModal');

	// Get the <span> element that closes the modal
	let span = $('.__close');

	// When the user clicks the button, open the modal
	$('#__modalButton').on('click', function () {
		modal.css('display', 'block');
	});

	let hideModal = ()=>{
		modal.css('display', 'none');
	};

	// When the user clicks on <span> (x), close the modal
	for (var i = 0; i < span.length; i++) {
		var element = span[i];
		$(element).on('click', hideModal);
	}

	// When the user clicks anywhere outside of the modal, close it
	modal.on('click', function (event) {
		if (event.target === modal[0]) {
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
		);
	}
	if (title) {
		$('#ExtensionName').val(title);
	}
	if (description) {
		$('#ExtensionDescription').val(description);
	}
	if (reqData) {
		let itemToIdMap = {
			'Body text': '#BodyTextDataStream',
			'Body HTML': '#BodyHTMLDataStream',
			'Thumbnail': '#ThumbnailDataStream',
			'Original file': '#FileBinaryStream'
		};
		reqData.split(';').forEach(itemData => {
			let id = itemToIdMap[itemData];
			if (id) {
				// if 'Body text' is in reqData, check the #BodyTextDataStream
				$(id).attr('checked', true);
			}
		});
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
					resetTestEnv();
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
	$('#__extName').text($('.extension-name .first-row', element).text().trim());
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
		$('body').append(data);

		let activateTab = id => {
			$('.__selector > .tab-navigation .tab.active, .__selector > .tab-content .tab-pane.active').removeClass('active');
			$(`#${id},[data-tab=${id}]`).addClass('active');
		};
		$('.__selector > .tab-navigation .tab.enabled').on('click', data => {
			activateTab(data.target.id);
		});

		$('#__runTests').click(runTest);

		let currentOrg = getCurrentOrg();
		let modal = document.getElementById('__contentModal');
		let span = document.getElementsByClassName('__close');

		let hideModal = ()=>{
			modal.style.display = 'none';
		};

		for (var i = 0; i < span.length; i++) {
			var element = span[i];
			element.onclick = hideModal;
		}

		modal.onclick = function (event) {
			if (event.target === modal) {
				hideModal();
			}
		};

		let root = document.getElementById('__orgContent');
		Coveo.SearchEndpoint.endpoints['orgContent'] = new Coveo.SearchEndpoint({
			restUri: `https://${location.host}/rest/search`,
			accessToken: getCookieApiKey(),
			anonymous: false,
			isGuestUser: false,
			queryStringArguments: {
				organizationId: currentOrg
			}
		});
		Coveo.init(root, {
			ResultLink: {
				onClick: function (e, result) {
					e.preventDefault();
					$('#__testDocId').val(result.uniqueId);
					resetTestEnv();
					$('#__tab2').click();
					// Give the option to pass parameters before triggering the test
					// $('#__runTests').click();
				}
			}
		});
		let testSection = document.getElementById('__testSection');
		Coveo.init(testSection);
	});
}

/**
 * Gets the access token of the user from the document cookies
 *
 * https://stackoverflow.com/questions/5142337/read-a-javascript-cookie-by-name
 *
 * @returns The access token
 */
function getCookieApiKey() {
	let cookiestring = RegExp('' + 'access_token' + '[^;]+').exec(document.cookie);
	return unescape(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./, '') : '');
}



/**
 * Resets the results of the previous tests
 *
 */
function resetTestEnv() {
	$('#__testResults').text('');
	$('#__originalFile').html('');
	$('#__extensionTesterErrors').html('');
}


/**
 * Runs the extension test
 *
 */
function runTest() {

	resetTestEnv();

	//Show the loading bubbles
	let loadingElement = $('#__testLoading');
	loadingElement.css('display', 'block');

	$('#__testResults').text('');
	let apiTestsKey = getCookieApiKey();
	let currentOrg = getCurrentOrg();
	let extensionId = $('#__currentExtension').text();
	let uniqueId = $('#__testDocId').val();
	let testUrl = `https://${location.host}/rest/organizations/${currentOrg}/extensions/${extensionId}/test`;
	let documentUrl = `https://${location.host}/rest/search/document?uniqueId=${encodeURIComponent(uniqueId)}&access_token=${apiTestsKey}&organizationId=${currentOrg}`;
	let extensionSettingsUrl = `https://${location.host}/rest/organizations/${currentOrg}/extensions/${extensionId}`;
	let docUri = '';
	let errorBannerElement = $('#__extensionTesterErrors');
	errorBannerElement.empty();
	var toSendData = {
		"document": {
			"permissions": [],
			"metadata": [{
				"Values": {},
				"origin": "Extension tester"
			}],
			"dataStreams": [{
				"Values": {},
				"origin": "Extension tester"
			}],
		},
		"parameters": {}
	};

	//When all of these are true, fire the extension test
	//Each will be set to true when it finishes the async
	let requestsReady = {
		'bodyText': false,
		'bodyHTML': false,
		'thumbnail': false,
		'metadata': false,
		'documentData': false
	};
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
				let areAllRequestsCompleted = Object.keys(requestsReady).every(k => requestsReady[k]);
				if (areAllRequestsCompleted) {
					//Clears the original file selector, since we already have the extracted data
					$('#__originalFile').html('');
					runTestAjax();
				}
				else {
					counter++;
					if (counter > 500 && !displayedError) {
						addMessage('Something might have gone wrong, check the console for errors');
						displayedError = true;
					}
					setTimeout(wait, 100);
				}
			}
			wait();
		},
		success: function (data) {
			if (data.requiredDataStreams) {
				if ($.inArray('BODY_TEXT', data.requiredDataStreams) !== -1) {
					setBodyText();
				}
				else {
					requestsReady.bodyText = true;
				}

				if ($.inArray('BODY_HTML', data.requiredDataStreams) !== -1) {
					setBodyHTML();
				}
				else {
					requestsReady.bodyHTML = true;
				}

				if ($.inArray('THUMBNAIL', data.requiredDataStreams) !== -1) {
					setThumbnail();
				}
				else {
					requestsReady.thumbnail = true;
				}

				if ($.inArray('DOCUMENT_DATA', data.requiredDataStreams) !== -1) {
					addOriginalFile();
				}
				else {
					requestsReady.documentData = true;
				}
			}
			setDocumentMetadata();
		},
		error: function () {
			addMessage('Failed to fetch extension, stopping');
			loadingElement.css('display', 'none');
		}
	});



	/**
	 * Adds an original file selector
	 *
	 */
	function addOriginalFile() {
		$.get(chrome.extension.getURL('/html/originalFile.html'), function (data) {
			let originalFileElement = $('#__originalFile');
			originalFileElement.html(data);

			//Coveo things (vapor css)
			$('input[type=file]').change(function () {
				var fileValue = this.files.length ? this.files[0].name : '';
				var $input = $(this).closest('.file-input').find('.file-path');
				$input.val(fileValue);
				$input.toggleClass('has-file', !!fileValue);
				$(this).closest('.file-input').find('.clear-file').toggleClass('hidden', !fileValue);
			});
			$('.clear-file').click(function () {
				var $input = $(this).closest('.file-input');
				var $path = $input.find('.file-path');

				$input.find('input[type=file]').val('');
				$path.val('');
				$path.removeClass('hasFile');
				$(this).addClass('hidden');
			});

			let activateTab = id => {
				$('#__originalFile > .tab-navigation .tab.active, #__originalFile > .tab-content .tab-pane.active').removeClass('active');
				$(`#${id},[data-tab=${id}]`).addClass('active');
			};
			$('#__originalFile > .tab-navigation .tab.enabled').on('click', data => {
				activateTab(data.target.id);
			});
			//Coveo things

			$('#__uploadedFile').on('change', handleFileChange);
			$('#__noFile').click(function () {
				requestsReady.documentData = true;
			});
			if (docUri !== "") {
				$('#__originalLink').val(docUri);
			}
			$('#__useLinkBtn').on('click', useLinkOnClick);
		});
	}


	/**
	 * The onclick function for the 'use original link'
	 * This sends out an ajax request to the URL in question
	 * and adds the resulting HTMl to the document data of the tester
	 *
	 */
	function useLinkOnClick() {
		$.ajax({
			url: $('#__originalLink').val(),
			headers: {
				'Access-Control-Allow-Origin': '*'
			},
			method: 'GET',
			dataType: 'html',
			success: function (data) {
				toSendData.document.dataStreams[0].Values['DOCUMENT_DATA'] = {
					'inlineContent': base64Encode(data),
					'compression': 'UNCOMPRESSED'
				};
			},
			error: function (data) {
				addMessage(`Failed to get URL content: ${data}`);
			},
			complete: function () {
				requestsReady.documentData = true;
			}

		});
	}


	/**
	 * The onchange function for the uploaded file for the original
	 * file tester.
	 *
	 * https://stackoverflow.com/questions/16505333/get-the-data-of-uploaded-file-in-javascript
	 *
	 * @param {event} evt
	 */
	function handleFileChange(evt) {
		let files = evt.target.files; // FileList object

		// use the 1st file from the list
		let f = files[0];

		let reader = new FileReader();

		// Closure to capture the file information.
		reader.addEventListener("load", function () {
			toSendData.document.dataStreams[0].Values['DOCUMENT_DATA'] = {
				'inlineContent': reader.result.split(',').slice(1).join(','),
				'compression': 'UNCOMPRESSED'
			};
			requestsReady.documentData = true;
		}, false);

		// Read in the image file as a data URL.
		reader.readAsDataURL(f);
	}

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
						};
					}
					else {
						addMessage('Extension called for "Body text", but no Body Text exists for this document');
					}
				}
			},
			error: function () {
				addMessage('Extension called for "Body text", but no Body Text exists for this document');
			},
			complete: function () {
				requestsReady.bodyText = true;
			}
		});
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
							'inlineContent': btoa(unescape(encodeURIComponent(data))),
							'compression': 'UNCOMPRESSED'
						};
					}
					else {
						addMessage('Extension called for "Body HTML", but no Body HTML exists for this document');
					}
				}
			},
			error: function () {
				addMessage('Extension called for "Body HTML", but no Body HTML exists for this document');
			},
			complete: function () {
				requestsReady.bodyHTML = true;
			}
		});
	}


	/**
	 * Adds the Thumbnail data to the data to send
	 *
	 */
	function setThumbnail() {

		let url = `https://${location.host}/rest/search/datastream?access_token=${apiTestsKey}&organizationId=${currentOrg}&contentType=application%2Fbinary&dataStream=%24Thumbnail%24&uniqueId=${encodeURIComponent(uniqueId)}`;

		fetchBlob(url, function (blob) {
			// Array buffer to Base64:
			if (blob) {
				let str = btoa(String.fromCharCode.apply(null, new Uint8Array(blob)));
				toSendData.document.dataStreams[0].Values['THUMBNAIL'] = {
					'inlineContent': str,
					'compression': 'UNCOMPRESSED'
				};
			}
			else {
				addMessage('Extension called for "Thumbnail", but no Thumbnail exists for this document');
			}
			requestsReady.thumbnail = true;
		});
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
					docUri = data.printableUri;
					if ($('#__originalLink').length) {
						$('#__originalLink').val(docUri);
					}
					//Build the document metadata
					let parameters = $('.CoveoParameterList').coveo('get');
					if (parameters) {
						toSendData.parameters = parameters.getParameterPayload();
					}

					function addToJson(valueToAdd, addKey) {
						if (valueToAdd && valueToAdd.length) {
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
					addToJson(data);
				}
			},
			error: function () {
				addMessage('Failed to fetch document metadata');
			},
			complete: function () {
				requestsReady.metadata = true;
			}
		});
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
				if (data.status === 400) {
					addMessage(data.responseJSON.errorCode);
				} else if (data.responseJSON.result && data.responseJSON.result.reason) {
					data.responseJSON.result.reason = unescape(data.responseJSON.result.reason);
				}
				//$('#__testResults').text(unescape(JSON.stringify(data.responseJSON, null, 2).replace(/\\\\n/g, '\n').replace(/\\\\\\"/g, '\"')));
				let formatter = new JSONFormatter(data.responseJSON, Infinity, { hoverPreviewEnabled: false });
				$('#__testResults').html(formatter.render());
				loadingElement.css('display', 'none');
			}
		});
	}


	/**
	 * Add an error message to the test
	 *
	 * @param {string} msg - The error message
	 * @param {boolean} isWarning - True if is warning, else error
	 */
	function addMessage(msg, isWarning) {
		let message =
			`
		<div class='banner flex center-align bg-${isWarning === true ? 'yellow' : 'red'}'>
			<div class="banner-description">
				<p>${msg}</p>
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
	if ($('#__testHeader').length === 0) {
		$($('#extensions')[0].children[0].children[0]).append('<th id="__testHeader">Tests</th>');
	}
	for (let i = 0; i < $('#extensions')[0].children[1].children.length; i++) {
		let element = $('#extensions')[0].children[1].children[i];
		//If a button is not found and there is an extension present
		if ($(element).find('.btn').length === 0 && !$(element).hasClass('empty')) {
			$(element).append(`
				<td class="col">
					<div class="wrapper">
						<div class="btn">Test</div>
					</div>
				</td>
				`);
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

	$.get(chrome.extension.getURL('/config/config.json'), function (data) {
		data = JSON.parse(data);
		//Default values if no values are found
		chrome.storage.local.get({
			// Public key with only search enabled
			__publicApiKey: data['apiKey'],
			__searchURL: data['url']
		}, function (items) {
			apiKey = items.__publicApiKey;
			url = items.__searchURL;

			//Checks if there were changes on the page
			MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

			let observer = new MutationObserver(function (/*mutations, observer*/) {
				// If the EditExtensionComponent appears
				if ($('#EditExtensionComponent').length && $('#CreateExtension').length) {
					addExtensionSearchToPage();
				}

				// If extensions appears AND it wasn't already modified by this script
				if ($('#extensions').length && !$('#extensions').attr('__modified')) {

					if (addTestButtonDelay) {
						clearTimeout(addTestButtonDelay);
					}
					addTestButtonDelay = setTimeout(function () {
						addTestButtonsToPage();
						if (!$('#__contentModal').length) {
							addTestModal();
						}

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
 * Example:
 * Let's say you have the string "aaaa"
 * The extension tester would take the two first letters and merge them into a chinese symbol
 * So it would look like this: 慡慡
 * When you look at the unicode of those characters, it comes out to: \u6161
 * "61" being the hex of a
 * To combat this, one needs to take the string and add another UTF-8 character to it,
 * so if I wanted the string "aaaa" to appear, I would need to pass the string: "a\0a\0a\0a\0"
 * This string would get converted into the unicode \u6100, which is the letter "a" we're looking for
 * So this code creates a UTF-16 string: \u0061
 * It flips the character: \u6100
 * Encodes each character into ascii: a  (The   being \0)
 * Then it sends it back.
 * This also works with any valid unicode character, so encoding issues shouldn't be present
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
	for (var i = 0; i < hex.length; i += 2) {
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}
	return str;
}

//https://stackoverflow.com/questions/23013871/how-to-parse-into-base64-string-the-binary-image-from-response
function fetchBlob(uri, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', uri, true);
	xhr.responseType = 'arraybuffer';

	xhr.onload = function () {
		if (this.status === 200) {
			var blob = this.response;
			if (callback) {
				callback(blob);
			}
		}
		else {
			if (callback) {
				callback();
			}
		}
	};
	xhr.send();
}


/**
 * Gets the current org from the url
 *
 * @returns {string} The org string
 */
function getCurrentOrg() {
	return window.location.hash.substring(1).split('/')[0];
}


/**
 * A better btoa() function that doesn't crash everytime...
 *
 * https://stackoverflow.com/questions/19124701/get-image-using-jquery-ajax-and-decode-it-to-base64
 *
 * @param {string} str - The string to encode
 * @returns The base64 encoded string
 */
function base64Encode(str) {
	/*jslint bitwise: true */
	var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var out = "", i = 0, len = str.length, c1, c2, c3;
	while (i < len) {
		c1 = (str.charCodeAt(i++) & 0xff);
		if (i === len) {
			out += CHARS.charAt(c1 >> 2);
			out += CHARS.charAt((c1 & 0x3) << 4);
			out += "==";
			break;
		}
		c2 = str.charCodeAt(i++);
		if (i === len) {
			out += CHARS.charAt(c1 >> 2);
			out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
			out += CHARS.charAt((c2 & 0xF) << 2);
			out += "=";
			break;
		}
		c3 = str.charCodeAt(i++);
		out += CHARS.charAt(c1 >> 2);
		out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
		out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
		out += CHARS.charAt(c3 & 0x3F);
	}
	return out;
}