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
