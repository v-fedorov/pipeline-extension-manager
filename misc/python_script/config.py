#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" Crawl a Github's user repositories to find folders with Indexing Pipeline Extensions
    and create a scripts.json file to be imported by the Chrome extension """

import os
import yaml


def get_config(config_vars):
    """ Load and validate config """
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    config = yaml.safe_load(open("config.yml"))

    # Check for missing config keys
    is_config_missing = False
    for config_var in config_vars:
        if config_var not in config:
            is_config_missing = True
            print 'Missing key in config.yml: ' + config_var

    if is_config_missing:
        exit('Some required keys are missing from config.yml.')

    return config
