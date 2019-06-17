import cdk = require('@aws-cdk/cdk');
import rds = require('@aws-cdk/aws-rds');
import ec2 = require('@aws-cdk/aws-ec2')

export class AwsconfigLabStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const aurora = new rds.CfnDBCluster(this, 'myaurora', 
    {
      engine: "aurora",
      snapshotIdentifier: "arn:aws:rds:us-east-1:334387515186:cluster-snapshot:awsconfiglabstack-snapshot-awsconfiglabstack-myaurora-zigr0xn99u4h-19shh48gf5sn7"
    });
    const instance = new rds.CfnDBInstance(this, 'myaurora-instance',
    {
      dbInstanceClass: "db.r3.xlarge",
      engine: "aurora",
      dbClusterIdentifier: aurora.dbClusterName
    });

    const vpc = new ec2.Vpc(this, 'vpc');

    const postgres = new rds.DatabaseInstanceFromSnapshot(this, 'mypostgres',  
    { 
      snapshotIdentifier: "arn:aws:rds:us-east-1:334387515186:snapshot:testposgres",
      engine: rds.DatabaseInstanceEngine.Postgres,
      instanceClass: new ec2.InstanceType("r3.xlarge"),
      vpc: vpc
    });

  }
}
