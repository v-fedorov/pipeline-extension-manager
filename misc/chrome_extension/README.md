# Coveo extension manager
Manages and helps test pipeline extensions. With this extension, you can quickly add an extension from an existing gallery that gets updated then test it right after with any document avaible in the organization. This improves how quickly one can test extensions and find mistakes.

## Description
This extension has 2 parts to it:
1. The extensions gallery
2. The extension tester

### The gallery
The extension gallery can be found when one clicks on the "Add Extension" button in the top right of the extensions page.
This is what is looks like:
![extension gallery button](https://user-images.githubusercontent.com/17149559/27692683-569b0ad6-5cb5-11e7-996f-1d4f8e12c08e.png)
When clicked on, a Coveo seach pops up with a list of availible extensions. The extensions are added by the python script portion of the repo.
![extension gallery search](https://user-images.githubusercontent.com/17149559/27692821-abeb7b88-5cb5-11e7-8b81-17793b94eb6f.png)

#### Additional notes
If the search does not work, the org may have changed place in the future/does not exist anymore.
It is currently living in the Coveo's staging platform (QA).
To change where where the content is being taken, head to chrome://extensions/ and click on the options dialog.

### The tester
'Test' buttons can be found beside every extension
![test buttons](https://user-images.githubusercontent.com/17149559/27692869-cd622802-5cb5-11e7-8c69-f93b6b88c5f1.png)
Clicking on a 'Test' button will bring up the test interface
![test interace](https://user-images.githubusercontent.com/17149559/27692962-0a287034-5cb6-11e7-8922-e645696dad24.png)
Simply clicking on the document you want to test will start the test and the results will appear

#### !!Warning!!
Before you can search documents and test extensions, one MUST provide an API with valid permissions.
Instructions are be found in the 'Settings' tab of the tester

#### Additional notes about the tester
This will ONLY test metadata, it does not include permissions and datastreams.
These features will come in the future when the extension tester API is updated.

## How to build
1. Download/clone git repo
2. Turn on developer mode in chrome
3. Load unpacked extension
4. Find the `chrome_extension` folder in the repo under the `misc` folder
5. Don't forget to add the API key in the `settings` tab of the tester

## How to run
Head to the Coveo Cloud Platform extension's tab

## Dependencies
Google Chrome or Chromium

## Demo
Demo of adding a new extesion then testing it immediately with an existing document
![demo gif](https://user-images.githubusercontent.com/17149559/27694135-46eed5b4-5cb9-11e7-9ab3-dac634291270.gif)


## Notes
This was tested on Chromium 58.0 running Ubuntu 16.04
