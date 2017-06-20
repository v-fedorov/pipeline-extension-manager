# Indexer script
This is a python script made to index the extensions of a github user.
It looks in every repo of the user and looks for an 'extensions' folder
If a folder is found, it takes all the `.py` files and indexes them

## How to use
1. Get the python dependencies
	1. `pip install requests`
	2. `pip install pyyaml`
2. Change the `example-config.yml` into `config.yml` and add your own values
	1. Git: [Get your API key here](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
	2. Coveo: Use the PUSH source api key when it was created
3. Run the script
4. The return status should be `202` or `200`