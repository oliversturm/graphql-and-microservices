import "dotenv/config";
import OpenAI from "openai";

import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import { addResolversToSchema } from "@graphql-tools/schema";
import { getDescription, getPrice } from "./askGuru.js";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is not defined");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

const schema = loadSchemaSync("schema.graphql", {
  loaders: [new GraphQLFileLoader()],
});

const resolvers = {
  Query: {
    info: (_, { name }) => ({
      description: () => getDescription(openai)(name),
      indicativePriceUsd: () => getPrice(openai)(name).then(parseFloat),
    }),
  },
};

const schemaWithResolvers = addResolversToSchema({ schema, resolvers });

const app = express();
app.all("/graphql", createHandler({ schema: schemaWithResolvers }));
app.listen(4000);
console.log("GraphQL listening at http://localhost:4000/graphql");
