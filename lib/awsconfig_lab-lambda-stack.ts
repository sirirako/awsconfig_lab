import events = require('@aws-cdk/aws-events');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/cdk');
import iam = require('@aws-cdk/aws-iam');
import fs = require('fs');

export class lambdaS3Remediate extends cdk.Construct {

  /** allows accessing the counter function */


  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const lambdarole = new iam.Role(this, 'lambarole',
    {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicyArns: ["arn:aws:iam::aws:policy/AmazonS3FullAccess","arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"],
      roleName: "awsconfig_lab_lambda_role"
    });

    const lambdaFn = new lambda.Function(this, 'Singleton', {
      code: new lambda.InlineCode(fs.readFileSync('lambda/s3writeremediate.js', { encoding: 'utf-8' })),
      handler: 'index.handler',
      timeout: 300,
      runtime: lambda.Runtime.NodeJS810,
      role: lambdarole
    });



  }
}