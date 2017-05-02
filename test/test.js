'use strict';

const
    chai           = require( 'chai' ),
    chaiAsPromised = require( 'chai-as-promised' ),
    mlog           = require( 'mocha-logger' ),
    expect         = chai.expect,
    assert         = chai.assert;

chai.use( chaiAsPromised );

const
    AWSCognitoAuthorization = require( '../index' ),
    opts                    = {
        region: 'us-east-1',
        IdentityPoolId: 'us-east-1:8ef40589-1600-4050-bc19-b20eb273f0e6',
        DeveloperName: 'com.planet3.pam',
        TokenDuration: 3600
    },
    Credentials             = new AWSCognitoAuthorization( opts );

describe( 'AWSCognitoAuthorization testing:', function() {
    const results = {};

    mlog.pending( 'AWSCognitoAuthorization testing:' );

    it( 'should construct an object', function( done ) {
        mlog.pending( 'should construct an object' );

        if( Credentials.Federation ) {
            results.isReady = Credentials.Federation;
            mlog.success( 'Credentials are ready:', Credentials.Federation );
            done();
        }
    } );

    it( 'should check Cognito Health', function( done ) {
        mlog.pending( 'should check Cognito Health' );

        expect( Credentials.healthRequest() )
            .to.eventually.eql( 'healthy' )
            .then( r => {
                results.healthRequest = r;
                mlog.success( 'Cognito Health:', r );
                done();
            } )
            .catch( e => {
                mlog.error( e );
                done();
            } );
    } );

    it( 'should list Identities in Pool', function( done ) {
        mlog.pending( 'should check IdentityList' );

        expect( Credentials.listIdentities() )
            .to.eventually.be.fulfilled
            .then( r => {
                results.listIdentities = r;
                mlog.success( 'IdentityList:', JSON.stringify( r, null, 4 ) );
                done();
            } )
            .catch( e => {
                mlog.error( e );
                done();
            } );
    } );

    it( 'should provide AWSCognitoIdentity', function( done ) {
        mlog.pending( 'should provide AWSCognitoIdentity' );

        expect( Credentials.GetOpenIdTokenForDeveloperIdentity( 'nick@exploreplanet3.com' ) )
            .to.eventually.be.fulfilled
            .then( r => {
                results.AWSCognitoIdentity = r;
                mlog.success( 'AWSCognitoIdentity:', JSON.stringify( r, null, 4 ) );
                done();
            } )
            .catch( e => {
                mlog.error( e );
                done();
            } );
    } );

    it( 'should provide AWSCredentials', function( done ) {
        mlog.pending( 'should provide AWSCredentials' );

        expect( Credentials.GetCredentials( results.AWSCognitoIdentity ) )
            .to.eventually.be.fulfilled
            .then( r => {
                results.AWSCredentials = r;
                mlog.success( 'AWSCredentials:', JSON.stringify( r, null, 4 ) );
                done();
            } )
            .catch( e => {
                mlog.error( e );
                done();
            } );
    } );

    it( 'should provide both AWSCognitoIdentity and AWSCredentials', function( done ) {
        mlog.pending( 'should provide AWSCognitoIdentity and AWSCredentials (AWSFullCreds)' );

        expect( Credentials.GetAuthorization( 'nick@exploreplanet3.com' ) )
            .to.eventually.be.fulfilled
            .then( r => {
                results.AWSFullCreds = r;
                mlog.success( 'AWSFullCreds:', JSON.stringify( r, null, 4 ) );
                done();
            } )
            .catch( e => {
                mlog.error( e );
                done();
            } );
    } );
} );