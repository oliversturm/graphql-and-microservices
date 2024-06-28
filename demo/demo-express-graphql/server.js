import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import { addResolversToSchema } from "@graphql-tools/schema";

import compose from "lodash/fp/compose.js";
import map from "lodash/fp/map.js";
import mapValues from "lodash/fp/mapValues.js";
import filter from "lodash/fp/filter.js";
import any from "lodash/fp/any.js";

import { data } from "./countries.js";

const schema = loadSchemaSync("countries.graphql", {
  loaders: [new GraphQLFileLoader()],
});

// This block shows the basic required structure
// of the (top-level) data, though it doesn't include
// everything declared in the schema.

const resolvers = {
  Query: {
    countries: () => data,
  },
};

// This block implements the extra processing included
// in the schema.
//
//
// const areaPerPerson = (c) => () => c.areaKM2 / c.population;
//
// const includeFields = (fields) => {
//   const applyAll = (i) => mapValues((f) => f(i))(fields);
//   const includeField = (i) => ({ ...i, ...applyAll(i) });
//   return map((i) => includeField(i));
// };
//
// const filterNames = (sns) => (data) =>
//   sns
//     ? filter((i) => any((sn) => RegExp(sn, "i").test(i.name))(sns))(data)
//     : data;
//
// const fields = { areaPerPerson };
//
// const process = compose([includeFields(fields)]);
//
// const resolvers = {
//   Query: {
//     countries: (_, { searchNames }) =>
//       compose([process, filterNames(searchNames)])(data),
//   },
// };

const schemaWithResolvers = addResolversToSchema({ schema, resolvers });

const app = express();
app.all("/graphql", createHandler({ schema: schemaWithResolvers }));
app.listen(4000);
console.log("GraphQL listening at http://localhost:4000/graphql");
