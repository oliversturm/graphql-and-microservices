import express from "express";
import fetch from "node-fetch";
import { createHandler } from "graphql-http/lib/use/express";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import { addResolversToSchema } from "@graphql-tools/schema";

const schema = loadSchemaSync("schema.graphql", {
  loaders: [new GraphQLFileLoader()],
});

// This contacts one of the source services, using an API that
// is specific to that service (and not GraphQL). This may not be
// the best way to call this specific demo service, but it illustrates
// the point that we'll need to take what we can get when we create
// our own mash/proxy/facade service.
const fetchOrders = () =>
  fetch("http://localhost/query/overview/all", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "rm-orders.localhost",
    },
  }).then((res) => res.json());

const resolvers = {
  Query: {
    orders: () => fetchOrders(),
    order: (_, { id }) =>
      fetchOrders().then((orders) => orders.find((o) => o.id === id)),
  },
};

const schemaWithResolvers = addResolversToSchema({ schema, resolvers });

const app = express();
app.all("/graphql", createHandler({ schema: schemaWithResolvers }));
app.listen(6000);
console.log("GraphQL listening at http://localhost:6000/graphql");
