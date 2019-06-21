#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { AwsconfigLabStack } from '../lib/awsconfig_lab-stack';
import { CfnKey } from '@aws-cdk/aws-kms';

const app = new cdk.App();
const stack = new AwsconfigLabStack(app, 'AwsconfigLabStack',
{
    tags: {
        Purpose: 'AWSConfigLab'
    }
}
);

stack.node.applyAspect(new cdk.Tag('Stack','AWSConfig-Lab'))
