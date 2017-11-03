#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" Push a JSON file to a Coveo Push source """
import json
import sys
import requests

import push


class BatchPush(push.PushExtensionScripts):
    """ Helper to push scripts to a Coveo Push Source """

    def _get_file_uri(self):
        url = self._get_url("/files", {})
        res = requests.post(url, headers=self.coveo_headers)

        # print "_get_file_uri: {0} {1}".format(res.status_code, res.text)
        res.raise_for_status()
        return res.json()

    @staticmethod
    def _upload_data(file_info, data):

        payload = {
            "AddOrUpdate": data
        }

        res = requests.put(
            file_info[u'uploadUri'],
            json=payload,
            headers=file_info[u'requiredHeaders']
        )

        print "_upload_data: {0} {1}".format(res.status_code, res.text)

    def _send_batch_request(self, file_info):
        url = self._get_url(
            "/sources/{coveo_source_id}/documents/batch?fileId={fileId}",
            {"fileId": file_info[u'fileId']}
        )
        res = requests.put(url, headers=self.coveo_headers)
        print "_send_batch_request: {0} {1}".format(res.status_code, res.text)

    def push(self, filename):
        """ Send file to Coveo """
        with open(filename, 'r') as infile:
            scripts_data = json.loads(infile.read())

        self._change_status('REBUILD')

        file_info = self._get_file_uri()
        self._upload_data(file_info, scripts_data)
        self._send_batch_request(file_info)

        self._change_status('IDLE')


def main():
    """ Load a json payload and push it to a Coveo Push source using Batch """
    if len(sys.argv) < 2:
        print "Missing filename"
        exit()

    BatchPush().push(sys.argv[1])

if __name__ == "__main__":
    main()
