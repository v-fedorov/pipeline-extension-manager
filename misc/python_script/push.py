# #!/usr/bin/python
""" Push scripts.json to a Coveo Push source """

import json
import re
import yaml
import requests


class PushExtensionScripts(object):
    """ Helper to push scripts to a Coveo Push Source """

    def __init__(self):
        self.config_vars = ['coveo_org_id', 'coveo_source_id', 'coveo_api_key', 'coveo_push_url']
        self.get_config()

    def get_config(self):
        """ Load and validate config """
        self.config = yaml.safe_load(open("config.yml"))

        # Check for missing config keys
        is_config_missing = False
        for config_var in self.config_vars:
            if config_var not in self.config:
                is_config_missing = True
                print 'Missing key in config.yml: ' + config_var

        if is_config_missing:
            exit('Some required keys are missing from config.yml.')

        self.coveo_headers = {
            "Authorization": self.config['coveo_api_key'],
            "Content-Type": "application/json"
        }

        return self.config

    def _change_status(self, state):
        """ Update status of a source. state can be REBUILD or IDLE """
        url = self._get_url(
            "/sources/{coveo_source_id}/status?statusType={state}",
            {"state": state}
        )

        res = requests.post(url, headers=self.coveo_headers)
        print "_change_status: {0} {1}".format(res.status_code, res.text)

    def _get_url(self, url_format, extra):
        data = self.config.copy()
        data.update(extra)
        url = "{coveo_push_url}/organizations/{coveo_org_id}/" + url_format
        url = url.format(**data)
        url = re.sub(r'([^:])//+', '\\1/', url)

        print 'Url: ' + url
        return url

    def push_script(self, script_info):
        """ Send all results to the PUSH api """
        url = self._get_url('/documents?documentId={docId}', {'docId': script_info['url']})
        response = requests.put(url, json=script_info, headers=self.coveo_headers)

        print "{0}: {1} - {2}".format(
            script_info['rawfilename'],
            response.status_code,
            response.text
        )

    def push(self):
        """ Send scripts.json file to Coveo """
        with open('scripts.json', 'r') as infile:
            scripts_data = json.load(infile)

        self._change_status('REBUILD')

        for script_info in scripts_data:
            self.push_script(script_info)

        self._change_status('IDLE')


def main():
    """ Load scripts.json and push to a Coveo Push source """
    PushExtensionScripts().push()

if __name__ == "__main__":
    main()
