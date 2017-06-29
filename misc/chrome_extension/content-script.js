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
	$('#__modalButton').on('click', function(){
		modal.css('display', 'block');
	});

	// When the user clicks on <span> (x), close the modal
	for (var i = 0; i < span.length; i++) {
		var element = span[i];
		$(element).on('click', function(){
			modal.css('display', 'none');
		});
	}

	// When the user clicks anywhere outside of the modal, close it
	modal.on('click', function(event){
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
		//If its closing
		else if ($('#EditExtensionComponent').length == 0 && !$('#__modalButton')[0]) {
			setTimeout(function () {
				addTestButtonsToPage();
			}, 200);
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
 * Run the extension test
 * 
 */
function runTest() {
	let testElement = $('#__testLoading');
	testElement.css('display', 'block');
	$('#__testResults').text('');
	let apiTestsKey = $('#__testApiKey').val();
	let currentOrg = $('#OrganizationsPickerSearch_chosen > a > span').text().split('-').pop().trim();
	let extensionId = $('#__currentExtension').text();
	let uniqueId = $('#__testDocId').val();
	let testUrl = `https://${location.host}/rest/organizations/${currentOrg}/extensions/${extensionId}/test`;
	let documentUrl = `https://${location.host}/rest/search/document?uniqueId=${uniqueId}&access_token=${apiTestsKey}&organizationId=${currentOrg}`;
	let toSendData = {
		"document": {
			"permissions": [],
			"metadata": [
				{
					"Values": {

					}
				}
			]
		},
		"parameters": {}
	}

	//Get the document metadata
	$.ajax({
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
				testElement.css('display', 'none');
			}
			else {

				//Build the document metadata
				for (let value in data) {
					if (value === 'raw') {
						for (let rawValues in data[value]) {
							if (data[value][rawValues] != null) {
								if (data[value][rawValues].length != 0) {
									toSendData.document.metadata[0].Values[rawValues] = [data[value][rawValues]];
								}
							}
						}
					}
					else {
						//Double 'if' because JS doesnt seem to stop on the first FALSE it gets
						//Why JS, so much performance to gain
						if (data[value] != null) {
							if (data[value].length != 0) {
								toSendData.document.metadata[0].Values[value] = [data[value]];
							}
						}
					}
				}

				//Test the document with the extension
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
						testElement.css('display', 'none');
					}
				});
			}
		},
		error: function (data) {
			$('#__testResults').text(JSON.stringify(data.responseJSON, null, 2));
			testElement.css('display', 'none');
		}
	})
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
			if (document.getElementById('EditExtensionComponent')) {
				addExtensionSearchToPage();
			}

			// If extensions appears AND it wasn't already modified by this script
			if (document.getElementById('extensions') && !$('#extensions').attr('__modified')) {

				if (addTestButtonDelay) {
					clearTimeout(addTestButtonDelay);
				}
				addTestButtonDelay = setTimeout(function () {
					addTestButtonsToPage();
					addTestModal();
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