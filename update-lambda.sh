#!/bin/bash
# WARNING: This profile must change to match with the custom named profile assigned on your ~/.aws/credentials and ~/.aws/config
# For more information: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
export AWS_PROFILE=${2:-uriel}
echo "/usr/local/bin/aws lambda update-function-code $1 --function-name $1 --zip-file fileb://$1.zip";
/usr/bin/zip $1/$1.zip $1
/usr/local/bin/aws lambda update-function-code --function-name $1 --zip-file fileb://$1/$1.zip
