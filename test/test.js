'use strict';

const
    chai           = require( 'chai' ),
    chaiAsPromised = require( 'chai-as-promised' ),
    mlog           = require( 'mocha-logger' ),
    expect         = chai.expect,
    assert         = chai.assert;

chai.use( chaiAsPromised );

const
    AWSCredentials = require( '../index' ),
    config         = require( '../config.json' ),
    Credentials    = new AWSCredentials( config.credentials, config.options );

describe( 'AWSCredentials testing:', function() {
    const results = {};

    mlog.pending( 'AWSCredentials testing:' );

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

        expect( Credentials.AWSIdentityProvider( 'nick@exploreplanet3.com' ) )
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

    it( 'should provide AWSCognitoCredentials', function( done ) {
        mlog.pending( 'should provide AWSCognitoCredentials' );

        expect( Credentials.AWSCredentialsProvider( results.AWSCognitoIdentity ) )
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

    it( 'should provide both AWSCognitoIdentity and AWSCognitoCredentials', function( done ) {
        mlog.pending( 'should provide AWSCognitoIdentity and AWSCognitoCredentials (AWSCredentials)' );

        expect( Credentials.GetAuthorization( 'nick@exploreplanet3.com' ) )
            .to.eventually.be.fulfilled
            .then( r => {
                results.AWSFullCreds = r;
                mlog.success( 'AWSCredentials:', JSON.stringify( r, null, 4 ) );
                done();
            } )
            .catch( e => {
                mlog.error( e );
                done();
            } );
    } );
} );