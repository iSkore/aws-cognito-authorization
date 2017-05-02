'use strict';

const
    Benchmark               = require( 'benchmark' ),
    AWSCognitoAuthorization = require( '../index' );

const
    opts        = {
        region: 'us-east-1',
        IdentityPoolId: 'us-east-1:8ef40589-1600-4050-bc19-b20eb273f0e6',
        DeveloperName: 'com.planet3.pam',
        TokenDuration: 3600
    },
    Credentials = new AWSCognitoAuthorization( opts );

const suite = new Benchmark.Suite;

suite
    .add( 'Request#ping', function() {
        Credentials.healthRequest()
            .then( console.log )
            .catch( console.log );
    } )
    .add( 'Object#construction', function() {
        new AWSCognitoAuthorization( opts );
    } )
    .on( 'cycle', function( event ) {
        console.log( event );
    } )
    .on( 'complete', function() {
        console.log( 'Fastest is ' + this.filter( 'fastest' ).map( 'name' ) );
    } )
    .run( { 'async': true } );