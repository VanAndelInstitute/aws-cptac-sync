export default {
	apiGateway: {
		REGION: 'us-east-2',
		URL: 'https://twcmi5flza.execute-api.us-east-2.amazonaws.com/dev'
	},
	cognito: {
		REGION: 'us-east-2',
		USER_POOL_ID: 'us-east-2_NNHBlw2uB',
		APP_CLIENT_ID: '2e8jujkb87sn9906ro2qrn2o1s',
		IDENTITY_POOL_ID: 'us-east-2:8dc19316-a8e6-4607-8520-a47a14987a8b'
	},
	oauth: {
		domain: 'cptac-sync-dev.auth.us-east-2.amazoncognito.com',
		scope: ['email', 'openid'],
		redirectSignIn: 'https://cptac-sync-dev.aws.vai.org/',
		redirectSignOut: 'https://cptac-sync-dev.aws.vai.org/',
		responseType: 'token' // or token
	}
};