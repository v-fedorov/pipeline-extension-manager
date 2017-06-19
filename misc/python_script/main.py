#!/usr/bin/python
import requests
import json
import base64
import yaml

# Load API keys
config = yaml.safe_load(open("keys.yml"))
if(len(config) != 2):
	exit("Failed to find all API keys")

### Github settings
user = "coveo-labs"
gitUrl = "https://api.github.com/users/{0}/repos".format(user)
gitAuth = config['Git']
gitHeaders = {"Authorization": gitAuth}

### Push API settings
orgID = "extensions"
sourceID = "xohlxjrobk77gcxxdjvytnca2i-extensions"
coveoAuth = config['Coveo']
coveoHeaders = {"Accept": "application/json", "Authorization" : coveoAuth, "Content-Type": "application/json"}

#Final data variable
data = []

# Get all repos for the user
gitRepoRequest = requests.get(gitUrl, headers = gitHeaders)
gitRepoData = json.loads(gitRepoRequest.text)

print "Found {0} repo(s) for {1}".format(len(gitRepoData), user)

# Loop through all the repos
for repos in gitRepoData:

	print "Searching {0} for 'extensions' folder".format(repos['name'])

	# Get all files in the repo
	repoContentsUrl = '/'.join(repos['contents_url'].split('/')[:-1])
	repoContentsRequest = requests.get(repoContentsUrl, headers = gitHeaders)
	repoContentsData = json.loads(repoContentsRequest.text)

	# Loop through all the files in the repo
	for repoContent in repoContentsData:

		# Find the 'extensions' folder
		if(repoContent['name'] == 'extensions' and repoContent['type'] == 'dir'):
			
			print "Found 'extensions' folder in {0}".format(repos['name'])

			# Get all the content in the extensions folder
			extensionContentsUrl = repoContent['url']
			extensionContentsRequest = requests.get(extensionContentsUrl, headers = gitHeaders)
			extensionContentsData = json.loads(extensionContentsRequest.text)

			# Loop through all the files in the extension folder
			for extensionFile in extensionContentsData:
				
				# Find all .py files
				if(extensionFile['name'].split(".")[-1] == "py"):

					print "Found extension {0}".format(extensionFile['name'])

					extensionFileUrl = extensionFile['url']
					extensionFileRequest = requests.get(extensionFileUrl, headers = gitHeaders)
					extensionFileData = json.loads(extensionFileRequest.text)

					extensionFileContent = extensionFileData['content']

					extensionFileContent = base64.b64decode(''.join(extensionFileContent.split('\n')))
					
					# Extract the metadata
					title = []
					description = []
					reqData = []
					for line in extensionFileContent.split("\n"):
						if "# Title: " in line:
							title.append(line.split("# Title: ")[1])

						if "# Description: " in line:
							description.append(line.split("# Description: ")[1])

						if "# Required data: " in line:
							reqData.extend(line.split("# Required data: ")[1].split(", "))
					
					data.append({
						"rawfilename": ' '.join(extensionFile['name'].split(".")[:-1]),
						"title": ' '.join(title), 
						"description": ' '.join(description), 
						"required": reqData, 
						"content": base64.b64encode(extensionFileContent),
						"url": extensionFile['html_url'],
						"type": "extension"
					})

print "Sending {0} extension(s) to Coveo Index".format(len(data))

# Send all results to the PUSH api
for result in data:
	r = requests.put("https://pushqa.cloud.coveo.com/v1/organizations/"+orgID+"/sources/"+sourceID+"/documents?documentId=" + result['url'],
					data=json.dumps(result), headers = coveoHeaders)

	print "{0}: {1}".format(result['rawfilename'], r.status_code)
