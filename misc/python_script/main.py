#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" Crawl a Github's user repositories to find folders with Indexing Pipeline Extensions
    and push them in a Coveo Org (Push source) to be imported by the Chrome extension """

import datetime
import sys

import GithubCrawler
import BatchPush


def main():
    """ Crawl Github repos to find extensions scripts and push them using PushAPI. """

    # default filename
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = 'extensionscripts_%s.json' % timestamp

    if len(sys.argv) > 1:
        filename = sys.argv[1]

    print "FILENAME: " + filename

    GithubCrawler.GithubCrawler().parse(filename)
    BatchPush.BatchPush().push(filename)

if __name__ == "__main__":
    main()
