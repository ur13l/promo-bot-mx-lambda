#!/usr/bin/env bash
/usr/local/bin/aws dynamodb --endpoint-url http://localhost:8000 create-table --table-name promo_bot_mx_promos --key-schema AttributeName=id,KeyType=HASH AttributeName=created_at,KeyType=RANGE --attribute-definitions AttributeName=id,AttributeType=S AttributeName=created_at,AttributeType=N  --billing-mode PAY_PER_REQUEST
