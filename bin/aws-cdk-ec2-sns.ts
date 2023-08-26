#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkEc2SnsStack } from '../lib/aws-cdk-ec2-sns-stack';
import { NetworkStack } from '../lib/network-stack';
import {ApplicationStack} from '../lib/application-stack'

const app = new cdk.App();

const network = new NetworkStack(app, "NetworkStack", {
  cidr: "10.0.0.0/20"
})

const application = new ApplicationStack(app, "ApplicationStack", {
  vpc: network.vpc,
  //optional
  keyName: "Ec2keyPairDemo"
})

//wait for the network stack deployed already befor application stack
application.addDependency(network)