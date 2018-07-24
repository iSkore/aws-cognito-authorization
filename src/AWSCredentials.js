'use strict';

const
	AWS   = require( 'aws-sdk' ),
	https = require( 'https' );

/**
 * @class AWSCredentials
 */
class AWSCredentials
{
	/**
	 * @param options
	 * @type {!object}
	 * @desc <code>options</code> required for communication with <a href="https://aws.amazon.com/cognito/">AWS Cognito</a> Identity Pool
	 * @property {!string} IdentityPoolId - "{region}:{IdentityPoolId UUID}"
	 * @property {!string} DeveloperName - "com.developer.name" for Developer provider name
	 * @property {number} TokenDuration - Amount of time the session token should last
	 * @property {!string} region - AWS Region of operation
	 * @property {?string} accessKeyId - AWS Access Key
	 * @property {?string} secretAccessKey - AWS Secret Key
	 * @property {?profile} profile - AWS Local Profile
	 */
	constructor( options )
	{
		const
			required = [ 'IdentityPoolId', 'DeveloperName', 'region' ],
			missing  = this.isMissingProperty( options, required ),
			isNull   = this.isNullProperty( options, required );
		
		if( missing || isNull )
			throw `Argument Error - Missing or Empty Property: ${missing || isNull}`;
		
		this.IdentityPoolId = options.IdentityPoolId;
		this.DeveloperName  = options.DeveloperName;
		this.TokenDuration  = options.TokenDuration || 86400;
		this.Federation     = options.Federation || 'cognito-identity.amazonaws.com';
		
		delete options.IdentityPoolId;
		delete options.DeveloperName;
		delete options.TokenDuration;
		delete options.Federation;
		
		if( options.hasOwnProperty( 'profile' ) ) {
			options.params = { profile: options.profile };
			delete options.profile;
		}
		
		this.COG = new AWS.CognitoIdentity( options );
		
		this.init();
	}
	
	init()
	{
		this.healthRequest()
			.then( () => this.isReady = true )
			.catch( () => this.isReady = false );
	}
	
	p( op )
	{
		return new Promise( op );
	}
	
	/**
	 * healthRequest
	 * @returns {HTTPResponse}
	 * @desc Does a health check on AWSCognito via <a href="https://cognito-identity.amazonaws.com/ping">GET /ping HTTP/1.1</a>
	 */
	healthRequest()
	{
		return this.p( ( res, rej ) => {
			https.get( `${this.COG.endpoint.href}/ping`, body => {
				body.on( 'data', d => res( d.toString() ) );
			} ).on( 'error', rej );
		} );
	}
	
	isMissingProperty( obj, properties )
	{
		let hasOwnProperty = false, i = 0;
		for( ; i < properties.length; i++ )
			if( !obj.hasOwnProperty( properties[ i ] ) )
				hasOwnProperty = properties[ i ];
		return hasOwnProperty;
	}
	
	isNullProperty( obj, properties )
	{
		let isNullProperty = false, i = 0;
		for( ; i < properties.length; i++ )
			if( obj.hasOwnProperty( properties[ i ] ) )
				if( !obj[ properties[ i ] ] )
					isNullProperty = properties[ i ];
		return isNullProperty;
	}
	
	/**
	 * listIdentities
	 * @param results - amount of Identities to list
	 * @param token - <code>NextToken</code> to continue listing identities
	 * @desc ListIdentities call to list Identities in Identity Pool
	 * @returns {array}
	 */
	listIdentities( results = 10, token = null )
	{
		return this.p( ( res, rej ) => {
			const params = {
				IdentityPoolId: this.IdentityPoolId,
				MaxResults: results,
				HideDisabled: true
			};
			
			if( token )
				params.NextToken = token;
			
			this.COG.listIdentities( params, ( e, d ) => {
				if( e ) rej( e );
				else res( d );
			} );
		} );
	}
	
	/**
	 * GetAuthorization
	 * @param authoritativeProperty
	 * @desc Function returns a <code>AWSCognitoIdentity</code> and <code>AWSCognitoCredentials</code> object
	 *       Both are needed to assume <code>AWS.Credentials</code>
	 * returns: {AWSCognitoIdentity, AWSCognitoCredentials}
	 */
	GetAuthorization( authoritativeProperty )
	{
		return this.p( ( res, rej ) => {
			const result = {};
			this.AWSIdentityProvider( authoritativeProperty )
				.then( r => Object.assign( result, r ) )
				.then( r => this.AWSCredentialsProvider( r ) )
				.then( r => Object.assign( result, r ) )
				.then( res )
				.catch( rej );
		} );
	}
	
	/**
	 * AWSIdentityProvider
	 * @param authoritativeProperty
	 * @desc AWSIdentityProvider call to get temporary Cognito IdentityId and Token
	 * returns: {AWSCognitoIdentity <IdentityId, Token>}
	 */
	AWSIdentityProvider( authoritativeProperty )
	{
		if( !authoritativeProperty )
			throw 'Argument Error - Must have Authoritative Property';
		
		return this.p( ( res, rej ) => {
			this.COG.getOpenIdTokenForDeveloperIdentity( {
				IdentityPoolId: this.IdentityPoolId,
				Logins: {
					[ this.DeveloperName ]: authoritativeProperty
				},
				TokenDuration: this.TokenDuration
			}, ( e, r ) => e ? rej( e ) : res( r ) );
		} );
	}
	
	/**
	 * AWSCredentialsProvider
	 * @param AWSCognitoIdentity
	 * @desc AWSCredentialsProvider call to get temporary AccessKeyId, SecretKey, and SessionToken from AWSCognitoIdentity
	 * returns: {AWSCognitoCredentials <IdentityId, Credentials <AccessKeyId, SecretKey, SessionToken, Expiration>>}
	 */
	AWSCredentialsProvider( AWSCognitoIdentity, CustomRoleArn )
	{
		return this.p( ( res, rej ) => {
			this.COG.getCredentialsForIdentity( {
				IdentityId: AWSCognitoIdentity.IdentityId,
				CustomRoleArn,
				Logins: {
					[ this.Federation ]: AWSCognitoIdentity.Token
				}
			}, ( e, r ) => e ? rej( e ) : res( r ) );
		} );
	}
}

module.exports = AWSCredentials;
