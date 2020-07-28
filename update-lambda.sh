#!/bin/bash
# WARNING: This profile must change to match the custom named profile assigned on your ~/.aws/credentials and ~/.aws/config
# For more information: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
# Use: $ ./update-lambda.sh [function-name*] [profile]
export AWS_PROFILE=${2:-default}
echo "/usr/local/bin/aws lambda update-function-code $1 --function-name $1 --zip-file fileb://$1.zip";
cd ./$1/  
pwd
zip -r $1.zip .
aws lambda update-function-code --function-name $1 --zip-file fileb://$1.zip
