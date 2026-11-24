import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

const backend = defineBackend({
  auth,
  data,
});

// Region and account of the deployed stack (no hardcoded account ID)
const { region, account } = Stack.of(backend.data.resources.graphqlApi);

// HTTP data source: AppSync signs requests to Bedrock with its own IAM role
const bedrockDataSource = backend.data.resources.graphqlApi.addHttpDataSource(
  "bedrockDS",
  `https://bedrock-runtime.${region}.amazonaws.com`,
  {
    authorizationConfig: {
      signingRegion: region,
      signingServiceName: "bedrock",
    },
  },
);

// Least privilege: invoke only Claude Haiku 4.5, via the US inference profile
// (the profile can route to the model in any of these three regions)
const MODEL = "anthropic.claude-haiku-4-5-20251001-v1:0";
bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:${region}:${account}:inference-profile/us.${MODEL}`,
      ...["us-east-1", "us-east-2", "us-west-2"].map(
        (r) => `arn:aws:bedrock:${r}::foundation-model/${MODEL}`,
      ),
    ],
  }),
);
