#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { AwsconfigLabStack } from '../lib/awsconfig_lab-stack';

const app = new cdk.App();
new AwsconfigLabStack(app, 'AwsconfigLabStack');
