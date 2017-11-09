/*
 *	EXTENSION GALLERY
 */

/*global Coveo */


class ExtensionGallery {

  /**
   * Sets up the javascript for the modal
   */
  static setupModal() {

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

    let hideModal = () => {
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
  static onClick(e, result) {
    let title = result.title;
    let description = result.raw.extdescription;
    let reqData = result.raw.extrequired;
    let uniqueId = result.uniqueId;

    ExtensionGallery.setAceEditorValue('');

    $('#BodyTextDataStream, #BodyHTMLDataStream, #ThumbnailDataStream, #FileBinaryStream').attr('checked', false);
    $('#ExtensionName, #ExtensionDescription').val('');

    if (uniqueId) {
      $.get(`${url}/rest/search/v2/html?organizationId=extensions&uniqueId=${uniqueId}&access_token=${apiKey}`,
        function (data) {
          ExtensionGallery.setAceEditorValue($(data).contents()[4].innerHTML);
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
   */
  static createModal() {
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
          onClick: (e, result) => {
            e.preventDefault();
            resetTestEnv();
            ExtensionGallery.onClick(e, result);
          }
        }
      });

      ExtensionGallery.setupModal();
    });
  }

  /**
   * Adds the select with options to the page after 350 ms the edit modal started appearing
   */
  static addExtensionSearchToPage() {
    if (addTimeOut) {
      clearTimeout(addTimeOut);
    }
    addTimeOut = setTimeout(function () {
      //If its opening
      if ($('#EditExtensionComponent').length && !$('#__modalButton')[0]) {
        ExtensionGallery.createModal();
      }
    }, 350);
  }

  /**
   * Sets the value of the ace editor by injecting JS into the main page
   * https://stackoverflow.com/questions/3955803/page-variables-in-content-script
   * @param {string} stringToSet - The string to set
   */
  static setAceEditorValue(stringToSet) {
    let scriptContent = `window.ace.edit('AceCodeEditor').setValue(\`${stringToSet}\`)`;

    let script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    $('#tmpScript').remove();
  }

}







