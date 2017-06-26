'use strict';
//The global timeout variable for the addToPage()
var addTimeOut;
//The api key
var apiKey;
//The url of the cloud platform
var url;

/**
 * Sets up the javascript for the modal
 * 
 */
function setupModal() {

	let svgButton = `
	<svg height="18" width="18" style="
	    position: absolute;
	    top:50%;
	    transform:translate(-50%, -50%);
	">
		<polygon points="0,0 0,18 18,9" style="fill:#f58020;"></polygon>
		Search
	</svg>
	`;

	$('#__search > div.coveo-search-section > div > a').html(svgButton);

	// Get the modal
	let modal = document.getElementById('__myModal');

	// Get the button that opens the modal
	let btn = document.getElementById('__modalButton');

	// Get the <span> element that closes the modal
	let span = document.getElementsByClassName('__close');

	let resultList = document.getElementById('__resultList');

	// When the user clicks the button, open the modal 
	btn.onclick = function () {
		modal.style.display = 'block';
	}

	// When the user clicks on <span> (x), close the modal
	for (var i = 0; i < span.length; i++) {
			var element = span[i];
			element.onclick = function () {
				modal.style.display = 'none';
			}
		}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function (event) {
		if (event.target == modal) {
			modal.style.display = 'none';
		}
		else {
			//Check if the check was inside the result list
			if (resultList.contains(event.target)) {
				//Check if the click was inside a result
				$('#__resultList > div')[0].childNodes.forEach(function (element) {
					//Check if its the specific result
					//If it is, take the hidden values and put them in the editor
					if (element.contains(event.target)) {

						let title = $(element.children[0].children[0]).attr('data-ext-title');
						let description = $(element.children[0].children[1]).attr('data-ext-desc');
						let reqData = $(element.children[0].children[2]).attr('data-ext-required');
						let uniqueId = $(element.children[0].children[3]).attr('data-ext-id');

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
						modal.style.display = "none";
					}
				}, this);
			}
		}
	}

}

/**
 * Creates the modal componant of the page along with the button
 * 
 */
function createModal() {
	let editorElement = $('#EditExtensionComponent > div > div > form > div:nth-child(2)')[0];
	//Get the HTML data
	$.get(chrome.extension.getURL('/html/extension-search.html'), function (data) {
		let containerDiv = document.createElement('div');
		containerDiv.innerHTML = data;
		editorElement.insertBefore(containerDiv, editorElement.childNodes[0]);

		//Init the Coveo search
		var root = document.getElementById('__search');
		Coveo.SearchEndpoint.endpoints['default'] = new Coveo.SearchEndpoint({
			restUri: `${url}/rest/search`,
			accessToken: apiKey
		});
		Coveo.init(root);

		setupModal();
	});
}


/**
 * The onchange function of the select
 * sets the title, description, checkboxes and editor values
 * 
 */
function extensionChooserOnChange() {
	let index = $(this).val();

	setAceEditorValue('');
	$('#BodyTextDataStream').attr('checked', false);
	$('#BodyHTMLDataStream').attr('checked', false);
	$('#ThumbnailDataStream').attr('checked', false);
	$('#FileBinaryStream').attr('checked', false);
	$('#ExtensionName').val('');
	$('#ExtensionDescription').val('');

	if (options[index]) {
		setAceEditorValue(atob(options[index].content));
		$('#ExtensionName').val(options[index].value)
		$('#ExtensionDescription').val(options[index].desc);
		if (options[index].reqData) {
			options[index].reqData.split(';').forEach(function (element) {
				if (element === 'Body text') {
					$('#BodyTextDataStream').attr('checked', true);
				}
				else if (element === 'Body HTML') {
					$('#BodyHTMLDataStream').attr('checked', true);
				}
				else if (element === 'Thumbnail') {
					$('#ThumbnailDataStream').attr('checked', true);
				}
				else if (element === 'Original file') {
					$('#FileBinaryStream').attr('checked', true);
				}
			}, this);
		}
	}
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
		if ($('#EditExtensionComponent').length && !$('#__modalButton')[0]) {

			createModal();

		}
	}, 350);
}

/**
 * The onclick for the test button
 * 
 * @param {object} element - The row element
 */
function testOnClick(element) {
	let extId = $('.extension-name .second-row', element).text().trim();
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

function addTestModal() {
	$.get(chrome.extension.getURL('/html/content-search.html'), function (data) {
		$('#extensions').append(data);

		$('#__runTests').click(runTest);

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
	});
}

function runTest(){
	let currentOrg = $('#OrganizationsPickerSearch_chosen > a > span').text().split('-').pop().trim();
	let extensionId = $('#__currentExtension').text();
	let testUrl = `https://${location.host}/rest/organizations/${currentOrg}/extensions/${extensionId}/test`;
	console.log(testUrl);
}

/**
 * Adds the Test buttons in the table of the extensions
 * 
 */
function addTestButtonsToPage() {
	//Do this first, since it will be called multiple times
	//before the async function is done below
	//This is to ensure we don't get multiple columns
	$('#extensions').attr('__modified', true)
	$.get(chrome.extension.getURL('/html/extension-test.html'), function (data) {
		$($('#extensions')[0].children[0].children[0]).append('<th>Tests</th>');
		for (let i = 0; i < $('#extensions')[0].children[1].children.length; i++) {
			let element = $('#extensions')[0].children[1].children[i];
			$(element).append(data);
			$(element).find('.btn')[0].onclick = function () {
				testOnClick(element);
			}
		}
	});
}


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
				addTestButtonsToPage();
				addTestModal();
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

	var scriptContent = `window.ace.edit("AceCodeEditor").setValue(\`${stringToSet}\`)`;

	var script = document.createElement('script');
	script.id = 'tmpScript';
	script.appendChild(document.createTextNode(scriptContent));
	(document.body || document.head || document.documentElement).appendChild(script);

	$('#tmpScript').remove();

}

function retrieveWindowVariables(variables) {
    var ret = {};

    var scriptContent = "";
    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        scriptContent += "if (typeof " + currVariable + " !== 'undefined') $('body').attr('tmp_" + currVariable + "', " + currVariable + ");\n"
    }

    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        ret[currVariable] = $("body").attr("tmp_" + currVariable);
        $("body").removeAttr("tmp_" + currVariable);
    }

    $("#tmpScript").remove();

    return ret;
}