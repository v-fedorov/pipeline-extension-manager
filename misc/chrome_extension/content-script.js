'use strict';
//The global timeout variable for the addToPage()
var addTimeOut;
var apiKey = 'xx0b957ee7-8846-4b6c-b4c3-6f88362e601f';

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
	let span = document.getElementsByClassName('__close')[0];

	let resultList = document.getElementById('__resultList');

	// When the user clicks the button, open the modal 
	btn.onclick = function () {
		modal.style.display = 'block';
	}

	// When the user clicks on <span> (x), close the modal
	span.onclick = function () {
		modal.style.display = 'none';
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
							$.get(`https://platformqa.cloud.coveo.com/rest/search/v2/html?organizationId=extensions&uniqueId=${uniqueId}&access_token=${apiKey}`,
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
			restUri: 'https://platformqa.cloud.coveo.com/rest/search',
			//Public key with only search enabled
			//accessToken: 'xx55c20bcb-59aa-40a2-b8b2-72ae625e6762'
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
		if (document.getElementById('EditExtensionComponent') && !$('#__modalButton')[0]) {

			createModal();

		}
	}, 350);
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
		}
	});
}

window.onload = function () {
	// your code 

	//Checks if there were changes 
	MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

	var observer = new MutationObserver(function (mutations, observer) {
		// fired when a mutation occurs
		if (document.getElementById('EditExtensionComponent')) {
			addExtensionSearchToPage();
		}

		if (document.getElementById('extensions') && !$('#extensions').attr('__modified')) {
			addTestButtonsToPage();
		}

		// ...
	});

	// define what element should be observed by the observer
	// and what types of mutations trigger the callback
	observer.observe(document, {
		subtree: true,
		attributes: true
	});

	//Output of seachAPI
	//https://platformqa.cloud.coveo.com/rest/search/?format=json&organizationId=extensions&access_token=xx55c20bcb-59aa-40a2-b8b2-72ae625e6762

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