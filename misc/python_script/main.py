#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" Crawl a Github's user repositories to find folders with Indexing Pipeline Extensions
    and create a scripts.json file to be imported by the Chrome extension """

import json
import base64
import re
import zlib
import requests

import config


class GithubParser(object):
    """ Parser for Github repositories and to find extensions scripts """

    def __init__(self):
        self.config = config.get_config(['git_user', 'git_api_key'])

    def request_github(self, url):
        """ Query to Github API """
        response = requests.get(url, headers={"Authorization": self.config['git_api_key']})
        data = response.json()

        with open('temp/%s.json' % re.sub(r'[^\w]', '_', url), 'w') as outfile:
            json.dump(data, outfile, indent=2)

        return data

    @staticmethod
    def is_extension_folder(obj):
        """ Validate if obj is a 'extensions' folder """
        if not('name' in obj and obj['name'] == 'extensions'):
            return False
        if not('type' in obj and obj['type'] == 'dir'):
            return False
        return True

    def find_extension_script(self, github_file_obj):
        """ Parse a github resource object and return JSON for the current script """

        file_name = github_file_obj['name']
        file_url = github_file_obj['url']
        print "Found extension {}".format(file_name)

        extension_file_data = self.request_github(file_url)

        file_content = extension_file_data['content']
        file_content = base64.b64decode(''.join(file_content.split('\n')))

        # Extract the metadata
        title = []
        description = []
        req_data = []

        for line in file_content.split("\n"):
            if "# Title: " in line:
                title.append(line.split("# Title: ")[1])

            if "# Description: " in line:
                description.append(
                    line.split("# Description: ")[1])

            if "# Required data: " in line:
                req_data.extend(line.split(
                    "# Required data: ")[1].split(", "))

        url = github_file_obj['html_url']
        return {
            "DocumentId": url,
            "rawfilename": ' '.join(file_name.split(".")[:-1]),
            "title": ' '.join(title),
            "description": ' '.join(description),
            "required": req_data,
            "CompressedBinaryData": base64.b64encode(zlib.compress(file_content)),
            "url": url,
            "FileExtension": '.py'
        }

    def parse(self):
        """ Queries GitHub to find Indexing Pipeling Extensions """

        scripts_data = []

        # Get all repos for the user
        url = "https://api.github.com/users/{0}/repos".format(self.config['git_user'])
        github_user_repos = self.request_github(url)

        if not isinstance(github_user_repos, list):
            print json.dumps(github_user_repos)
            exit()

        print "Found {0} repo(s) for {1}".format(len(github_user_repos), self.config['git_user'])

        # Loop through all the repos
        for repo in github_user_repos:

            print "Searching {} for 'extensions' folder".format(repo['name'])

            # Get all files in the repo
            repo_contents_url = '/'.join(repo['contents_url'].split('/')[:-1])
            repo_contents = self.request_github(repo_contents_url)

            # Loop through all the files in the repo
            for repo_content in repo_contents:

                # Find the 'extensions' folder
                if self.is_extension_folder(repo_content):
                    print "Found 'extensions' folder in {0}".format(repo['name'])

                    # Get all the content in the extensions folder
                    extension_files = self.request_github(repo_content['url'])

                    # Loop through all the files in the extension folder
                    for extension_file in extension_files:

                        # Find all .py files
                        if re.search(r'\.py$', extension_file['name']):
                            scripts_data.append(self.find_extension_script(extension_file))

        with open('scripts.json', 'w') as outfile:
            json.dump(scripts_data, outfile, indent=2)


def main():
    """ Load scripts.json and push to a Coveo Push source """
    GithubParser().parse()

if __name__ == "__main__":
    main()
