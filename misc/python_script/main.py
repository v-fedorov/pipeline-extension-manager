#!/usr/bin/python
import requests
import json
import base64
import yaml

# Load config
config = yaml.safe_load(open("config.yml"))

# Check for missing config keys
config_vars = ['coveo_org_id', 'coveo_source_id', 'coveo_api_key',  'coveo_push_url', 'git_user', 'git_api_key']
is_config_missing = False
for config_var in config_vars:
	if config_var not in config:
		is_config_missing = True
		print 'Missing key in config.yml: ' + config_var

if is_config_missing:
	exit('Config key is missing')

### Github settings
user = config['git_user']
git_url = "https://api.github.com/users/{0}/repos".format(user)
git_auth = config['git_api_key']
git_headers = {"Authorization": git_auth}

### Push API settings
org_id = config['coveo_org_id']
source_id = config['coveo_source_id']
coveo_auth = config['coveo_api_key']
coveo_headers = {"Accept": "application/json", "Authorization" : coveo_auth, "Content-Type": "application/json"}

#Final data variable
data = []

# Get all repos for the user
git_repo_request = requests.get(git_url, headers = git_headers)
git_repo_data = json.loads(git_repo_request.text)

print "Found {0} repo(s) for {1}".format(len(git_repo_data), user)

# Loop through all the repos
for repos in git_repo_data:

	print "Searching {0} for 'extensions' folder".format(repos['name'])

	# Get all files in the repo
	repo_contents_url = '/'.join(repos['contents_url'].split('/')[:-1])
	repo_contents_request = requests.get(repo_contents_url, headers = git_headers)
	repo_contents_data = json.loads(repo_contents_request.text)

	# Loop through all the files in the repo
	for repo_content in repo_contents_data:

		# Find the 'extensions' folder
		if(repo_content['name'] == 'extensions' and repo_content['type'] == 'dir'):
			
			print "Found 'extensions' folder in {0}".format(repos['name'])

			# Get all the content in the extensions folder
			extension_contents_url = repo_content['url']
			extension_contents_request = requests.get(extension_contents_url, headers = git_headers)
			extension_contents_data = json.loads(extension_contents_request.text)

			# Loop through all the files in the extension folder
			for extension_file in extension_contents_data:
				
				# Find all .py files
				if(extension_file['name'].split(".")[-1] == "py"):

					print "Found extension {0}".format(extension_file['name'])

					extension_file_url = extension_file['url']
					extension_file_request = requests.get(extension_file_url, headers = git_headers)
					extension_file_data = json.loads(extension_file_request.text)

					extension_file_content = extension_file_data['content']

					extension_file_content = base64.b64decode(''.join(extension_file_content.split('\n')))
					
					# Extract the metadata
					title = []
					description = []
					reqData = []
					for line in extension_file_content.split("\n"):
						if "# Title: " in line:
							title.append(line.split("# Title: ")[1])

						if "# Description: " in line:
							description.append(line.split("# Description: ")[1])

						if "# Required data: " in line:
							reqData.extend(line.split("# Required data: ")[1].split(", "))
					
					data.append({
						"rawfilename": ' '.join(extension_file['name'].split(".")[:-1]),
						"title": ' '.join(title), 
						"description": ' '.join(description), 
						"required": reqData, 
						"content": base64.b64encode(extension_file_content),
						"url": extension_file['html_url'],
						"type": "extension"
					})

print "Sending {0} extension(s) to Coveo Index".format(len(data))

# Send all results to the PUSH api
for result in data:
	r = requests.put("{0}/organizations/{1}/sources/{2}/documents?documentId={3}".format(config['coveo_push_url'], org_id, source_id, result['url']),
					data=json.dumps(result), headers = coveo_headers)

	print "{0}: {1}".format(result['rawfilename'], r.status_code)
