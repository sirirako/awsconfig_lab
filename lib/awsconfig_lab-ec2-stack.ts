import cdk = require('@aws-cdk/cdk');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import iam = require('@aws-cdk/aws-iam');
import { ServicePrincipal } from '@aws-cdk/aws-iam';
import { UpdateType } from '@aws-cdk/aws-autoscaling';

export class ec2fleet extends cdk.Construct {

  /** allows accessing the counter function */


  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const vpc = new ec2.Vpc(this, 'VPC', {
        maxAZs: 2
    });

    const windows = new ec2.WindowsImage(ec2.WindowsVersion.WindowsServer2019EnglishFullBase);
    
    const amznLinux = new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AmazonLinux,
        edition: ec2.AmazonLinuxEdition.Standard,
        virtualization: ec2.AmazonLinuxVirt.HVM,
        storage: ec2.AmazonLinuxStorage.GeneralPurpose,
      });

      const ec2role = new iam.Role(this, 'webserver_role',
      {
        assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
        managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"],
        roleName: "awsconfig_lab_ec2_role"
      });

      const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
        vpc,
        instanceType: new ec2.InstanceTypePair(ec2.InstanceClass.Burstable2, ec2.InstanceSize.Micro),
        machineImage: amznLinux,
        maxCapacity: 6,
        minCapacity: 3,
        role: ec2role,
        updateType: UpdateType.RollingUpdate
        
      });
      
      let userData: string = "sudo yum update -y \n"
        + "sudo yum install -y httpd \n"
        + "sudo service httpd start \n"
        + "sudo chkconfig httpd on \n"
        + "usermod -a -G apache ec2-user \n"
        + "chown -R ec2-user:apache /var/www \n"
        + "chmod 2775 /var/www \n"
        + "find /var/www -type d -exec chmod 2775 {} \; \n"
        + "find /var/www -type f -exec chmod 0664 {} \; "

      let userData2: string = "curl -sL https://rpm.nodesource.com/setup_8.x | bash - \n"
        + "yum install -y nodejs \n"
        + "npm install forever -g \n"
        + "mkdir /home/ec2-user/node-website \n"
        + "echo -e \"var http = require('http');\" &>> /home/ec2-user/node-website/app.js \n"
        + "echo -e \"http.createServer(function (req, res) {\" &>> /home/ec2-user/node-website/app.js \n"
        + "echo -e \"res.writeHead(200, {'Content-Type': 'text/plain'});\" &>> /home/ec2-user/node-website/app.js \n"
        + "echo -e \"res.end('Hello World!');\" &>> /home/ec2-user/node-website/app.js \n"
        + "echo -e \"}).listen(80);\" &>> /home/ec2-user/node-website/app.js \n"
        + "export PORT=80\n"
        + "forever start /home/ec2-user/node-website/app.js"
      asg.addUserData(userData2);

      const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
        vpc,
        internetFacing: true
      });
  
      const listener = lb.addListener('Listener', {
        port: 80,
      });
  
      listener.addTargets('Target', {
        port: 80,
        targets: [asg]
      });
  
      listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');
  
      asg.scaleOnRequestCount('AModestLoad', {
        targetRequestsPerSecond: 1
  });

      


  }
}