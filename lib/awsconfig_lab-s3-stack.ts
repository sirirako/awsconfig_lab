import cdk = require('@aws-cdk/cdk');
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam')



export class s3bucket extends cdk.Construct {
    public readonly thisBucket: s3.Bucket
  /** allows accessing the counter function */


  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const bucket1 = new s3.Bucket(this, 'Bucket1', {
        //publicReadAccess: true,
        //blockPublicAccess: s3.BlockPublicAccess.BlockAll
        
        
    });
    const grant = bucket1.grantPublicAccess();
    //grant.resourceStatement!.addCondition('IpAddress', { "aws:SourceIp" : "54.240.143.0/24"});

    const bucket2 = new s3.Bucket(this, 'Bucket2');
    bucket2.grantReadWrite(new iam.Anyone);

  }
}