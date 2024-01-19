# -*- coding: utf-8 -*-
import logging
import os


def handler(event, context):
    logger = logging.getLogger()
    logger.info(event)
    logger.info(os.environ)
    logging.info(context.credentials.to_dict())
    return 'hello world'
