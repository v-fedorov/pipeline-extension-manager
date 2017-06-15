'use strict';
//The global timeout variable for the addToPage()
var addTimeOut;
//Contains all the option values (title, description, content, required data)
var options = [];


function createModal() {
	let editorElement = $('#EditExtensionComponent > div > div > form > div:nth-child(2)')[0];
	// let testButton = document.createElement('div');
	// testButton.style = 'margin: 0 !important;float:right';
	// $(testButton).addClass("btn mod-prepend spaced-box");
	// testButton.innerHTML = `<span class="btn-prepend">+</span>Add from gallery`;
	// editorElement.insertBefore(document.createElement('br'), editorElement.childNodes[0]);
	// editorElement.insertBefore(testButton, editorElement.childNodes[0]);
	$.get(chrome.extension.getURL('/modal.html'), function (data) {
		let containerDiv = document.createElement('div');
		containerDiv.innerHTML = data;
		editorElement.insertBefore(containerDiv, editorElement.childNodes[0]);
		let scriptElement = document.createElement('script');
		let script = `
		// Get the modal
		var modal = document.getElementById('__myModal');

		// Get the button that opens the modal
		var btn = document.getElementById("__modalButton");

		// Get the <span> element that closes the modal
		var span = document.getElementsByClassName("__close")[0];

		// When the user clicks the button, open the modal 
		btn.onclick = function () {
			modal.style.display = "block";
		}

		// When the user clicks on <span> (x), close the modal
		span.onclick = function () {
			modal.style.display = "none";
		}

		// When the user clicks anywhere outside of the modal, close it
		window.onclick = function (event) {
			if (event.target == modal) {
				modal.style.display = "none";
			}
		}
		`;
		scriptElement.innerHTML = script;
		editorElement.insertBefore(scriptElement, editorElement.childNodes[0]);
		let coveoScript = `
		var root = document.getElementById('__search');
		Coveo.SearchEndpoint.endpoints['default'] = new Coveo.SearchEndpoint({
			restUri: 'https://platformqa.cloud.coveo.com/rest/search',
			accessToken: 'xx55c20bcb-59aa-40a2-b8b2-72ae625e6762'
		});
		Coveo.init(root);
		`;
		let coveoScriptElement = document.createElement('script');
		coveoScriptElement.innerHTML = coveoScript;
		editorElement.insertBefore(coveoScriptElement, editorElement.childNodes[0]);
		// data += scriptElement;
		// $(scriptElement).appendTo('body');
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
function addToPage() {
	if (addTimeOut) {
		clearTimeout(addTimeOut);
	}
	addTimeOut = setTimeout(function () {
		if (document.getElementById('EditExtensionComponent') && !$('#__extensionChooser')[0]) {

			createModal();

			let selectElement = document.createElement('select');
			selectElement.onchange = extensionChooserOnChange;
			$(selectElement).addClass('chosen js-chosen-single-select');
			selectElement.id = '__extensionChooser';
			let defaultOption = document.createElement('option');
			defaultOption.innerText = 'Choose a script to load';
			defaultOption.value = -1;
			selectElement.appendChild(defaultOption);
			for (let i = 0; i < options.length; i++) {
				let element = options[i];
				let option = document.createElement('option');
				option.innerText = element.title;
				option.value = i;
				selectElement.appendChild(option);
			}
			let footerElement = $('#EditExtensionComponent > div > footer')[0];
			footerElement.insertBefore(selectElement, footerElement.childNodes[0]);
		}
	}, 350);
}


window.onload = function () {
	// your code 

	//Checks if there were changes 
	MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

	var observer = new MutationObserver(function (mutations, observer) {
		// fired when a mutation occurs
		if (document.getElementById('EditExtensionComponent')) {
			addToPage();
		}
		// ...
	});

	// define what element should be observed by the observer
	// and what types of mutations trigger the callback
	observer.observe(document, {
		subtree: true,
		attributes: true
	});

	//Gets all the search results possible for the scripts
	$.getJSON('https://platformqa.cloud.coveo.com/rest/search/?format=json&organizationId=extensions&access_token=xx55c20bcb-59aa-40a2-b8b2-72ae625e6762', function (data) {
		data.results.forEach(function (result) {
			options.push({
				title: result.raw.rawfilename,
				value: result.raw.title,
				desc: result.raw.description,
				content: result.raw.content,
				reqData: result.raw.required
			});
		}, this);
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