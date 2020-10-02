#!/bin/bash
source .env
sam deploy --parameter-overrides "TelegramURL=$TELEGRAM_URL" --profile $AWS_LOCAL_PROFILE
