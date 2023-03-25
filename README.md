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

Install required packages for client

```
cd client
npm i
..
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

#### On First Deployment

There are a few things not deployed due to security or due to difficulty in configuration the first time

##### Configure your Cognito Role Mappings

Once deployment is done, replace the RoleMappings IdentityProvider key with the resource ids that were deployed

1. Open cognito-identity-pool.yml
2. Find CognitoIdentityPoolRoles > Properties > RoleMappings
3. Uncomment block and update cognito-idp.YOUR_REGION.amazonaws.com/YOUR_COGNITO_USERPOOL_ID:YOUR_COGNITO_CLIENT_ID
4. Deploy updated values using 'serverless deploy'

##### Configuration SSO IdP

1. Open the Cognito User Pool serverless framework created for you
2. (Optional) Configure Federation
   - Go to Sign-in experience > Federated identity provider sign-in > Add identity provider
      - Select SAML
      - Provide configuration:
         - Provider name
         - metadata document endpoint URL
         - attribute mappings (e.g., email -> email, name -> name, preferred_username -> email)
3. Configure App Integration
   - Go to App integration > App Clients > Create app client
      - Provide App client settings:
         - Select Public client
         - App client name
      - Provide Hosted UI settings:
         - Allowed callback URL
         - Allowed sign-out URL
         - Identity provider created in step 2
         - OAuth 2.0 grant types (e.g., Authorization code grant)
         - OpentID Connect scopes (e.g, Profile, Email, OpenID)
   - Go to App integreation > Domain
      - Add a domain prefix or bring your own
   - (Optional) Go to UI Customization
      - Upload an image or change any CSS you want to change to the hosted login page

#### Set up secrets

Secrets aren't automatically deployed due not wanting secrets (such as api keys) in configuration files

1. Open Secrets Manager on the AWS Console
2. Click Store New Secret
3. Select Other Type of Secrets
4. Enter Secret Information
5. Click Next
6. Enter Secret Name
7. Add costcenter to tags
8. Click Next
9. Click Next
10. Click Store

### Static Files

Build React project using the client project

```
cd client
npm run build
cd ..
```

Create S3 bucket with bucket owner enforced
```
aws s3api create-bucket --bucket <bucket> --create-bucket-configuration LocationConstraint=<region> --object-ownership BucketOwnerEnforced
aws s3api put-public-access-block --bucket <bucket> --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```
Upload client code
```
aws s3 cp client/build s3://<bucket>/ --recursive
```
Create CloudFront distribution:
   - Origin domain: `<bucket>.s3.<region>.amazonaws.com`
   - Origin access > Origin access control settings > Create control setting
      - Copy policy, Go to S3 bucket permissions, update \<bucket> Bucket policy
   - Default root object: `index.html`

## References

* Serverless documentation (https://serverless.com/framework/docs/providers/aws/)
* Serverless AWS Alerts documentation (https://github.com/ACloudGuru/serverless-plugin-aws-alerts)
