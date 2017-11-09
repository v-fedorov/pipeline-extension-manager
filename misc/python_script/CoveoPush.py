#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" Push documents to a Coveo Push source """

import json
import re
import sys

import requests
import config


class CoveoPush(object):
    """ Helper to push documents to a Coveo Push Source """

    def __init__(self):
        config_vars = ['coveo_org_id', 'coveo_source_id', 'coveo_api_key', 'coveo_push_url']
        self.config = config.get_config(config_vars)
        self.coveo_headers = {
            "Authorization": self.config['coveo_api_key'],
            "Content-Type": "application/json"
        }

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

    def push_doc(self, script_info):
        """ Send one document to the PUSH api """
        url = self._get_url('/documents?documentId={docId}', {'docId': script_info['url']})
        response = requests.put(url, json=script_info, headers=self.coveo_headers)

        print "{0}: {1} - {2}".format(
            script_info['rawfilename'],
            response.status_code,
            response.text
        )

    def push(self, filename):
        """ Load a payload and add documents to a Push source, one document at a time. """
        with open(filename, 'r') as infile:
            scripts_data = json.load(infile)

        self._change_status('REBUILD')

        for script_info in scripts_data:
            self.push_doc(script_info)

        self._change_status('IDLE')


def main():
    """ Load a payload file, iterate over documents
        and push them to a Coveo Push source one by one """
    if len(sys.argv) < 2:
        print "Missing filename"
        exit()

    CoveoPush().push(sys.argv[1])

if __name__ == "__main__":
    main()
