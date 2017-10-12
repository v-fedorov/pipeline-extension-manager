# #!/usr/bin/python
""" Push a JSON file to a Coveo Push source """

import json
import re
import sys
import yaml
import requests


class BatchPush(object):
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

    def _get_file_uri(self):
        url = self._get_url("/files", {})
        res = requests.post(url, headers=self.coveo_headers)
        res.raise_for_status()
        return res.json()

    def _get_url(self, url_format, extra):
        data = self.config.copy()
        data.update(extra)
        url = "{coveo_push_url}/organizations/{coveo_org_id}/" + url_format
        url = url.format(**data)
        url = re.sub(r'([^:])//+', '\\1/', url)

        print 'Url: ' + url
        return url

    def _upload_data(self, file_info, data):
        res = requests.put(
            file_info.uploadUri,
            json=data,
            headers=file_info.requiredHeaders
        )

        print "_upload_data: {0} {1}".format(res.status_code, res.text)

    def _send_batch_request(self, file_info):
        url = self._get_url(
            "/sources/{coveo_source_id}/documents/batch?fileId={fileId}",
            {"fileId": file_info.fileId}
        )
        res = requests.put(url, headers=self.coveo_headers)
        print "_send_batch_request: {0} {1}".format(res.status_code, res.text)

    def push(self, filename):
        """ Send scripts.json file to Coveo """
        with open(filename, 'r') as infile:
            scripts_data = json.loads(infile.read())

        self._change_status('REBUILD')
        file_info = self._get_file_uri()
        self._upload_data(file_info, scripts_data)
        self._send_batch_request(file_info)
        self._change_status('IDLE')


def main():
    """ Load scripts.json and push to a Coveo Push source """
    if len(sys.argv) < 2:
        print "Missing filename"
        exit()

    BatchPush().push(sys.argv[1])

if __name__ == "__main__":
    main()
