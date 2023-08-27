import { Stack, StackProps, aws_ec2, aws_iam } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as fs from "fs";

interface ApplicationProps extends StackProps {
  keyName: string;
  vpc: aws_ec2.Vpc;
}
export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationProps) {
    super(scope, id, props);

    //security group open 80 and 22
    const sg = new aws_ec2.SecurityGroup(this, "Open80And22SG", {
      securityGroupName: "Open80And22SG",
      vpc: props.vpc,
    });

    sg.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.tcp(80),
      "open port 80 for http"
    );

    // sg.addIngressRule(
    //   aws_ec2.Peer.anyIpv4(),
    //   aws_ec2.Port.tcp(8080),
    //   "open port 8080 for ses server docker"
    // );

    sg.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.tcp(22),
      "open port 22 for ssh"
    );

    //role for instance
    const role = new aws_iam.Role(this, "Ec2ToConnectSSMAndAccessS3", {
      roleName: "Ec2ToConnectSSMAndAccessS3",
      assumedBy: new aws_iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromManagedPolicyArn(
        this,
        "SSMManagedPolicyForEc2",
        "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      )
    );

    role.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["s3:*"],
      })
    );

    //ec2 in public subnet
    const ec2 = new aws_ec2.Instance(this, "PubEc2", {
      instanceName: "PubEc2",
      vpc: props.vpc,
      role: role,
      securityGroup: sg,
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PUBLIC,
      },
      instanceType: aws_ec2.InstanceType.of(
        aws_ec2.InstanceClass.T3,
        aws_ec2.InstanceSize.SMALL
      ),
      machineImage: new aws_ec2.AmazonLinuxImage({
        generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        edition: aws_ec2.AmazonLinuxEdition.STANDARD,
      }),
      allowAllOutbound: true,
    });

    // add user data to ec2
    ec2.addUserData(
      fs.readFileSync("./lib/user-data.sh", { encoding: "utf-8" })
    );
  }
}
