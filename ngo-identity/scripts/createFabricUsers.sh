#!/bin/bash

# This script registers and enrolls the user within the Fabric CA.  It then uploads the generated credentials to AWS Secrets Manager.
CERTS_FOLDER=/tmp/certs
PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin

# Chargeback Bureau Read access
FABRIC_USERNAME_USER=chargebackUser

# Chargeback manager
FABRIC_USERNAME_MANAGER=chargebackManager

# Users' password
FABRICUSERPASSWORD=defaultpassword

# Register and enroll NGO Donor
echo Registering user 'ngoDonor'
fabric-ca-client register --id.name "$FABRIC_USERNAME_USER" --id.affiliation "$MEMBERNAME" --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem --id.type user --id.secret "$FABRICUSERPASSWORD" --id.attrs "fullname='Bob D Donor':ecert,role=ngo_donor:ecert"

echo Enrolling user 'ngoDonor'
fabric-ca-client enroll -u https://"$FABRIC_USERNAME_USER":"$FABRICUSERPASSWORD"@"$CASERVICEENDPOINT" --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M "$CERTS_FOLDER"/"$FABRIC_USERNAME_USER" --enrollment.attrs "role,fullname,hf.EnrollmentID,hf.Affiliation"

# Put the credentials on Secrets Manager
echo Putting user 'ngoDonor' private key and certificate on Secrets Manager
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRIC_USERNAME_USER/pk" --secret-string "$(cat "$CERTS_FOLDER"/"$FABRIC_USERNAME_USER"/keystore/*)" --region "$REGION"
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRIC_USERNAME_USER/signcert" --secret-string "$(cat "$CERTS_FOLDER"/"$FABRIC_USERNAME_USER"/signcerts/*)" --region "$REGION"

# Register and enroll NGO Manager
echo Registering user 'ngoManager'
fabric-ca-client register --id.name "$FABRIC_USERNAME_MANAGER" --id.affiliation "$MEMBERNAME" --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem --id.type user --id.secret "$FABRICUSERPASSWORD" --id.attrs "fullname='Alice Manager':ecert,role=ngo_manager:ecert"

echo Enrolling user 'ngoManager'
fabric-ca-client enroll -u https://"$FABRIC_USERNAME_MANAGER":"$FABRICUSERPASSWORD"@"$CASERVICEENDPOINT" --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M "$CERTS_FOLDER"/"$FABRIC_USERNAME_MANAGER" --enrollment.attrs "role,fullname,hf.EnrollmentID,hf.Affiliation"

# Put the credentials on Secrets Manager
echo Putting user 'ngoManager' private key and certificate on Secrets Manager
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRIC_USERNAME_MANAGER/pk" --secret-string "$(cat "$CERTS_FOLDER"/"$FABRIC_USERNAME_MANAGER"/keystore/*)" --region "$REGION"
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRIC_USERNAME_MANAGER/signcert" --secret-string "$(cat "$CERTS_FOLDER"/"$FABRIC_USERNAME_MANAGER"/signcerts/*)" --region "$REGION"