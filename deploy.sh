#!/bin/bash
source .env
sam deploy --parameter-overrides "TelegramURL=$TELEGRAM_URL; "TelegramChatId=$TELEGRAM_CHAT_ID"" --profile $AWS_LOCAL_PROFILE
