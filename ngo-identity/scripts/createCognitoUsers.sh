#!/bin/bash

# Cognito Pool info
REGION=us-east-1
COGNITO_APIG_LAMBDA_STACK_NAME=cognito-apig-lambda-stack
COGNITO_USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $COGNITO_APIG_LAMBDA_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolID'].OutputValue" --output text --region $REGION )
echo Cognito pool id is "$COGNITO_USER_POOL_ID"

# User data
TEMP_PASSWORD=ChangeMe123!
CUSTOM_ATT_FABRIC_USER=custom:fabricUsername

# Users
USER_USERNAME=pandauser
USER_PASSWORD=Welcome123!
USER_FABRIC_USERNAME=chargebackUser

MANAGER_USERNAME=paulamanager
MANAGER_PASSWORD=Welcome123!
MANAGER_FABRIC_USERNAME=chargebackManager

# Create users, set Fabric username attribute, and set password
# Normal user
echo Creating Normal user
aws cognito-idp admin-create-user --user-pool-id "$COGNITO_USER_POOL_ID" --username "$USER_USERNAME" --temporary-password "$TEMP_PASSWORD" --region "$REGION"
aws cognito-idp admin-update-user-attributes --user-pool-id "$COGNITO_USER_POOL_ID" --username "$USER_USERNAME" --user-attributes Name=$CUSTOM_ATT_FABRIC_USER,Value=$USER_FABRIC_USERNAME --region "$REGION"
aws cognito-idp admin-set-user-password --user-pool-id "$COGNITO_USER_POOL_ID" --username "$USER_USERNAME" --password "$USER_PASSWORD" --permanent --region "$REGION"
echo Normal user successfully created
echo

# Manager user
echo Creating manager user
aws cognito-idp admin-create-user --user-pool-id "$COGNITO_USER_POOL_ID" --username "$MANAGER_USERNAME" --temporary-password "$TEMP_PASSWORD" --region "$REGION"
aws cognito-idp admin-update-user-attributes --user-pool-id "$COGNITO_USER_POOL_ID" --username "$MANAGER_USERNAME" --user-attributes Name=$CUSTOM_ATT_FABRIC_USER,Value=$MANAGER_FABRIC_USERNAME --region "$REGION"
aws cognito-idp admin-set-user-password --user-pool-id "$COGNITO_USER_POOL_ID" --username "$MANAGER_USERNAME" --password "$MANAGER_PASSWORD" --permanent --region "$REGION"
echo Manager user successfully created

# Helper to retrieve newly created users
# aws cognito-idp admin-get-user --user-pool-id $COGNITO_USER_POOL_ID --username $USER_USERNAME --region $REGION
