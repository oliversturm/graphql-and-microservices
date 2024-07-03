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

// This contacts the second source service, using GraphQL -- we could use a
// client library for additional comfort, but that's really not necessary
// for this simple case. Of course we could also be clever about combining
// the two supported fields as needed, but since we know that they always
// go to the OpenAI source separately that doesn't really matter either.
const fetchProductInfo = (name, field) =>
  fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query {
          info(name: "${name}") {
            ${field}
          }
        }
      `,
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data.info[field]);

// Since each of the extra fields we add is defined by a function, the
// fetch functionality will only be executed if the fields are included.
const augmentOne = (order) => ({
  ...order,
  aiProductDescription: () => fetchProductInfo(order.text, "description"),
  aiProductIndicativePriceUsd: () =>
    fetchProductInfo(order.text, "indicativePriceUsd").then(parseFloat),
});

const augment = (orders) => orders.map(augmentOne);

const resolvers = {
  Query: {
    orders: () => fetchOrders().then(augment),
    order: (_, { id }) =>
      fetchOrders()
        .then((orders) => orders.find((o) => o.id === id))
        .then(augmentOne),
  },
};

const schemaWithResolvers = addResolversToSchema({ schema, resolvers });

const app = express();
app.all("/graphql", createHandler({ schema: schemaWithResolvers }));
app.listen(6000);
console.log("GraphQL listening at http://localhost:6000/graphql");
