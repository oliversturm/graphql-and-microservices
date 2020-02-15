const express = require('express');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const { importSchema } = require('graphql-import');
const _ = require('lodash/fp');
const data = require('./countries');

const schema = buildSchema(importSchema('countries.graphql'));

// This block shows the basic required structure
// of the (top-level) data, though it doesn't include
// everything declared in the schema.
//

const root = {
  countries: data
};

/*
// This block implements the extra processing included
// in the schema.
//

const areaPerPerson = c => () => c.areaKM2 / c.population;

const includeFields = fields => {
  const applyAll = i => _.mapValues(f => f(i))(fields);
  const includeField = i => ({ ...i, ...applyAll(i) });
  return _.map(i => includeField(i));
};

const filterNames = sns => data =>
  sns
    ? _.filter(i => _.any(sn => RegExp(sn, 'i').test(i.name))(sns))(data)
    : data;

const fields = { areaPerPerson };

const process = _.compose([includeFields(fields)]);

const root = {
  countries: ({ searchNames }) =>
    _.compose([process, filterNames(searchNames)])(data)
};
*/

const app = express();

// For some reason, the GraphiQL thing doesn't work in
// Firefox due to some CSP violation. The error message sounds
// to me as if Firefox wants to disallow inline scripts by
// default - obviously Chrome has no problems with this.
// So I tried to configure a special CSP for this
// demo, and this is included as intended with the following
// code. However, Firefox keeps showing the same error.
// So for this demo - don't use Firefox. I'm sure there's
// an explanation, but I won't hunt it down right now.

// const csp = require('helmet-csp');
// app.use(
//   csp({
//     directives: {
//       scriptSrc: ["'self'", "'unsafe-inline'"]
//     }
//   })
// );

app.use(
  '/graphql',
  graphqlHttp({
    schema: schema,
    rootValue: root,
    graphiql: true
  })
);
app.listen(4000);
console.log('GraphQL listening at http://localhost:4000/graphql');
