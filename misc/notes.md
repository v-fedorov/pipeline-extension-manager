# How-to Update

## Get latest JSUI

From `misc` folder in a terminal :

`curl https://static.cloud.coveo.com/searchui/v2.10082/js/CoveoJsSearch.min.js -o chrome_extension/js/CoveoJsSearch.min.js`

## Chrome Store

To update the extension in the Chrome Store, we need to create a package (.zip file).

1. From `chrome_extension` folder in a terminal
1. `zip -r9 ../v$(node -p -e "require('./manifest.json').version").zip *`

This will create a new files `v0.1.2.zip` using the version in the manifest.
