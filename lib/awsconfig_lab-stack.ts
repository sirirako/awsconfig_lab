import cdk = require('@aws-cdk/cdk');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import ec2 = require('@aws-cdk/aws-ec2');
import elb = require('@aws-cdk/aws-elasticloadbalancing');
import s3 = require('@aws-cdk/aws-s3');
import {s3bucket} from './awsconfig_lab-s3-stack';
import {ec2fleet} from './awsconfig_lab-ec2-stack';

export class AwsconfigLabStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    
    
    const bucket1 = new s3bucket(this,'configbucket1');

    //const bucket2 = new s3bucket(this, 'configbucket2')
    
    const ec2 = new ec2fleet(this, 'ec2fleet');
    
    
    
    
    
  }
}
