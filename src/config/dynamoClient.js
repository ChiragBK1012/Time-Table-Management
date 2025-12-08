const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

// Validate environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn(
    "⚠️  Warning: AWS credentials not found in environment variables."
  );
  console.warn(
    "   Please ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set in .env file"
  );
}

// Create DynamoDB client configuration
const clientConfig = {
  region: process.env.AWS_REGION || "us-east-1",
};

// Only add credentials if they are provided
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

// Create DynamoDB client
const client = new DynamoDBClient(clientConfig);

// Create DynamoDB Document Client for easier operations
const dynamoClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Create a wrapper object with the methods we need
// The DynamoDBDocumentClient uses send() with commands
const db = {
  get: async (params) => {
    return await dynamoClient.send(new GetCommand(params));
  },
  put: async (params) => {
    return await dynamoClient.send(new PutCommand(params));
  },
  update: async (params) => {
    return await dynamoClient.send(new UpdateCommand(params));
  },
  delete: async (params) => {
    return await dynamoClient.send(new DeleteCommand(params));
  },
  query: async (params) => {
    return await dynamoClient.send(new QueryCommand(params));
  },
  scan: async (params) => {
    return await dynamoClient.send(new ScanCommand(params));
  },
};

module.exports = db;
