# aws-cptac-sync

Services to pull, transform and sync information from BSI to the CDR

The client provides the data manager with visibility with what information has been sent to the CDR and if the CDR has successfully received it

### Prerequisites

You will need the latest version of node.js to get started and get access to npm

```
Download the LTS version from https://nodejs.org/en/
```

## Getting Started

Install Serverless Framework

```
npm i serverless -g
```

Configure Serverless with AWS credentials

```
serverless config credentials --provider aws --key your_key_here --secret your_secret_here --profile vai
```

Install required packages

```
npm i
```

## Testing

To test you code, you can have serverless invoke your function

```
serverless invoke --function your_function_name
```

### Local Testing

Serverless also allows for limited local testing, depending on the services needed

Note: Some services cannot be simulated locally

```
serverless invoke local --function your_function_name
```

## Deployment

Serverless will deploy most of the resouces based on the configuration, but there are a few things you still need to do

### AWS Services

You can deploy your functions and AWS resources using serverless directly

```
serverless deploy
```

or

```
serverless deploy --verbose
```

Once deployment is done, replace the RoleMappings IdentityProvider key with the resource ids that were deployed

1. Open cognito-identity-pool.yml
2. Find CognitoIdentityPoolRoles > Properties > RoleMappings
3. Uncomment block and update cognito-idp.YOUR_REGION.amazonaws.com/YOUR_COGNITO_USERPOOL_ID:YOUR_COGNITO_CLIENT_ID
4. Deploy updated values using 'serverless deploy'

After deployment is done, log into the aws console

1. Open the Cognito User Pool serverless framework created for you
2. (Optional) Configure Federation
   - Go to Federation > Identity Providers
      - Select SAML
      - Provide configuration (I-Team needs to be involved to configure our IdP on our side)
   - Go to Federation > Attribute Mapping
      - Map SAML attributes to User Pool Attributes
3. Configure App Integration
   - Go to App Integration > App Client Settings
      - Enable Identity Providers you want to allow
      - Configure Sign in and Sign out URLs
      - Enable the OAuth flows and scopes you want to allow
   - Go to App Integreation > Domain Name
      - Add a domain prefix or bring your own
   - (Optional) Go to UI Customization
      - Upload an image or change any CSS you want to change to the hosted login page

### Static Files

Build React project using the client project

```
cd client
npm run build
cd ..
```

You can deploy your built react project using serverless finch

Note: This will completely remove any files already out there

```
serverless client deploy
```

## References

* Serverless documentation (https://serverless.com/framework/docs/providers/aws/)
* Serverless AWS Alerts documentation (https://github.com/ACloudGuru/serverless-plugin-aws-alerts)
* Serverless Finch (https://github.com/fernando-mc/serverless-finch)