>> Intrucciones de volcado de datos
1. Abrir cloud9: https://console.aws.amazon.com/cloud9/ide/927ac756b221403d813fa51c14bbeb52
https://github.com/aws-samples/non-profit-blockchain

2. ssh ec2-user@ec2-3-239-91-128.compute-1.amazonaws.com -i chargebackbureau-keypair.pem
desde el home

3. Ejecutar lo siguiente
REGION=us-east-1
COGNITO_APIG_LAMBDA_STACK_NAME=cognito-apig-lambda-stack

API_URL=$(aws cloudformation describe-stacks --stack-name $COGNITO_APIG_LAMBDA_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='APIGatewayURL'].OutputValue" --output text --region $REGION )

COGNITO_APP_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $COGNITO_APIG_LAMBDA_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CognitoAppClientID'].OutputValue" --output text --region $REGION )

4. Loguearse
ID_TOKEN=$(aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --auth-parameters USERNAME=pandauser,PASSWORD=Welcome123! --client-id $COGNITO_APP_CLIENT_ID --region $REGION --output text --query 'AuthenticationResult.IdToken')

5. Validar token de acceso
echo $ID_TOKEN

6. Ejecutar un ejemplo
curl -H "Authorization: $ID_TOKEN" -s -X POST "$API_URL/chargebacks" -d '{"id":"3", "amount":10}' -H "Content-Type: application/json"

7. Ejecutar los scripts data_dump_accepted y data_dump_rejected