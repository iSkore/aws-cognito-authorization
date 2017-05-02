'use strict';

const
    AWS   = require( 'aws-sdk' ),
    https = require( 'https' );

/**
 * @class AWSCognitoAuthorization
 */
class AWSCognitoAuthorization
{
    /**
     * @param {object} options required for communication with AWS and CognitoIdentity
     */
    constructor( options )
    {
        const
            required = [ 'IdentityPoolId', 'DeveloperName', 'TokenDuration' ],
            missing  = this.isMissingProperty( options, required ),
            isNull   = this.isNullProperty( options, required ),
            creds    = { params: {} };

        if( missing || isNull )
            throw `Argument Error - Missing or Empty Property: ${missing || isNull}`;

        if( options.hasOwnProperty( 'profile' ) )
            creds.params.profile = options.profile;

        if( options.hasOwnProperty( 'region' ) )
            creds.region  = options.region;

        this.COG = new AWS.CognitoIdentity( creds );

        this.IdentityPoolId = options.IdentityPoolId;
        this.DeveloperName  = options.DeveloperName;
        this.TokenDuration  = options.TokenDuration;
        this.Federation     = options.Federation || 'cognito-identity.amazonaws.com';

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
     * @returns {HTTPRequest}
     * @desc Does a health check on AWSCognito via GET /ping HTTP/1.1
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

    removeProperties( obj, properties )
    {
        let i = 0;
        for( ; i < properties.length; i++ )
            delete obj[ properties[ i ] ];
        return obj;
    }

    /**
     * listIdentities
     * @param results - amount of Identities to list
     * @param token - NextToken to continue listing identities
     * @returns {AWSIdentityList <Array>}
     * @desc ListIdentities call to list Identities in Identity Pool
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
     * @returns {AWSCognitoIdentity + AWSCredentials}
     * @desc Function returns a AWSCognitoIdentity and AWSCredentials object
     *       Both are needed to assume AWS.Credentials
     */
    GetAuthorization( authoritativeProperty )
    {
        return this.p( ( res, rej ) => {
            const result = {};
            this.GetOpenIdTokenForDeveloperIdentity( authoritativeProperty )
                .then( r => Object.assign( result, r ) )
                .then( r => this.GetCredentials( r ) )
                .then( r => Object.assign( result, r ) )
                .then( res )
                .catch( rej );
        } );
    }

    /**
     * GetOpenIdTokenForDeveloperIdentity
     * @param authoritativeProperty
     * @returns {AWSCognitoIdentity <IdentityId, Token>}
     * @desc GetOpenIdTokenForDeveloperIdentity call to get temporary Cognito access token
     */
    GetOpenIdTokenForDeveloperIdentity( authoritativeProperty )
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
     * GetCredentials
     * @param AWSCognitoIdentity
     * @returns {AWSCredentials <IdentityId, Credentials <AccessKeyId, SecretKey, SessionToken, Expiration>>}
     * @constructor
     * @desc GetsCredentialsForIdentity call to get temporary AccessKeyId and SecretKey
     */
    GetCredentials( obj )
    {
        return this.p( ( res, rej ) => {
            this.COG.getCredentialsForIdentity( {
                IdentityId: obj.IdentityId,
                CustomRoleArn: obj.CustomRoleArn,
                Logins: {
                    [ this.Federation ]: obj.Token
                }
            }, ( e, r ) => e ? rej( e ) : res( r ) );
        } );
    }
}

module.exports = AWSCognitoAuthorization;

// token.getToken = obj => {
//     return new Promise( ( res, rej ) => {
//         COG.getOpenIdTokenForDeveloperIdentity( {
//             IdentityPoolId: process.env.PoolId,
//             Logins: {
//                 [ process.env.DeveloperName ]: obj.email
//             },
//             TokenDuration: process.env.tokenDuration
//         }, ( e, r ) => {
//             if( e ) rej( e );
//             else {
//                 getCredentials( r )
//                     .then( creds => {
//                         r.Expiration = new Date().getTime() + ( process.env.tokenDuration * 1000 );
//                         r.organization = obj.organization;
//                         obj.session_token = token.encrypt( r );
//                         obj.Credentials = creds.Credentials;
//                         res( obj );
//                     } )
//                     .catch( e => rej( e ) );
//             }
//         } );
//     } );
// };
//
// function getCredentials( obj ) {
//     return new Promise( ( res, rej ) => {
//         COG.getCredentialsForIdentity( {
//             IdentityId: obj.IdentityId,
//             Logins: {
//                 [ process.env.cognito ]: obj.Token
//             }
//         }, ( e, r ) => e ? rej( e ) : res( r ) );
//     } );
// }
//
// function updateToken( obj ) {
//     return new Promise( ( res, rej ) => {
//         DDB.update( {
//             TableName: process.env.TableName,
//             Key: { email: obj.email },
//             UpdateExpression: 'set session_token = :token, Credentials = :creds',
//             ExpressionAttributeValues: {
//                 ':token': obj.session_token,
//                 ':creds': obj.Credentials
//             },
//             ReturnValues: 'UPDATED_NEW'
//         }, ( e, r ) => {
//             if( e ) rej( e );
//             else res( obj );
//         } );
//     } );
// }
//
// function isMissingProperty( obj, properties ) {
//     let hasOwnProperty = false, i = 0;
//     for( ; i < properties.length; i++ )
//         if( !obj.hasOwnProperty( properties[ i ] ) )
//             hasOwnProperty = properties[ i ];
//     return hasOwnProperty;
// }
//
// function isNullProperty( obj, properties ) {
//     let isNullProperty = false, i = 0;
//     for( ; i < properties.length; i++ )
//         if( obj.hasOwnProperty( properties[ i ] ) )
//             if( !obj[ properties[ i ] ] )
//                 isNullProperty = properties[ i ];
//     return isNullProperty;
// }
//
// exports.handler = ( event, context, cb ) => {
//     console.log( event );
//
//     const
//         missing = isMissingProperty( event, [ 'email', 'password' ] ),
//         isNull  = isNullProperty( event, [ 'email', 'password' ] );
//
//     let obj     = { email: event.email };
//
//     if( missing || isNull )
//         return cb( null, resp( 406, `Missing Property: ${missing || isNull}` ) );
//
//     getUser( obj )
//         .then( v  => obj = v )
//         .then( () => {
//             if( !obj ) cb( null, resp( 404, "User not Found" ) );
//             else if( !obj.verified ) cb( null, resp( 403, "User not Verified" ) );
//             else {
//                 obj.hash = obj.password;
//                 obj.password = event.password;
//             }
//         } )
//         .then( () => computeHash( obj ) )
//         .then( hs => hs === obj.hash )
//         .then( at => at ? token.getToken( obj ) : cb( null, resp( 401, 'User not Authorized' ) ) )
//         .then( t  => updateToken( obj, t ) )
//         .then( t  => removeProperties( t, [
//             'password', 'salt', 'IdentityId', 'Token', 'active',
//             'verified', 'validate_token', 'Expiration', 'hash'
//         ] ) )
//         .then( t  => cb( null, resp( 200, t ) ) )
//         .catch( e => cb( null, resp( 400, e ) ) );
// };