const express = require('express');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const fetch = require('isomorphic-fetch');
const parse = require('url').parse;
const extract = require('tld-extract');
const morgan = require('morgan');
const _ = require('lodash/fp');

const fetchStories = (skip, take) =>
  fetch('http://localhost:3000/api/query/HackerNews/allStories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      first: skip,
      offset: take
    })
  })
    .then(res => res.json())
    .catch(err => {
      console.error(`Fetch error: ${err}`);
    });

const fetchDomainInfo = _.memoize(domain =>
  fetch(`http://localhost:3003/domaininfo?q=${domain}`).then(res => res.json())
);

getDomain = url => extract(`http://${parse(url).hostname}`).domain;

const domainInfoHelpers = url => {
  if (!url)
    return { mailserver: 'n/a', domainCreationDate: 'n/a', domain: 'n/a' };
  const domain = getDomain(url);
  const domainInfo = url => fetchDomainInfo(domain);
  return {
    mailserver: () =>
      domainInfo(url).then(({ primaryMx }) => primaryMx || 'n/a'),
    domainCreationDate: () =>
      domainInfo(url).then(
        ({ whoisInfo }) =>
          whoisInfo['Creation Date'] || whoisInfo['Registered on'] || 'n/a'
      ),
    domain
  };
};

const augmentDomainInfo = _.map(s => ({ ...s, ...domainInfoHelpers(s.link) }));

// default lodash/fp map uses an iteratee with a parameter
// cap of 1 - we need two parameters below
const mapWithKey = _.map.convert({ cap: false });

const groupByDomain = (domains, skip, take) =>
  fetchStories(skip, take)
    .then(_.filter(s => !!s.link))
    .then(augmentDomainInfo)
    .then(_.groupBy('domain'))
    .then(
      mapWithKey((stories, domain) => ({
        domain,
        stories,
        count: stories.length
      }))
    )
    .then(_.sortBy('count'))
    .then(_.reverse);

const schema = buildSchema(/* GraphQL */ `
  type Story {
    title: String!
    text: String
    link: String
    commentCount: Int!
    createdAt: Int!
    createdBy: String!
    createdByName: String!
    id: String!
    type: String!
    votes: [String]!
    domain: String
    mailserver: String
    domainCreationDate: String
  }
  type Domain {
    domain: String!
    count: Int!
    stories: [Story]!
  }
  type Query {
    stories(skip: Int, take: Int): [Story]!
    byDomain(domains: [String!], skip: Int, take: Int): [Domain]!
  }
`);

const root = {
  stories: ({ skip, take }) => fetchStories(skip, take).then(augmentDomainInfo),
  byDomain: ({ domains, skip, take }) => groupByDomain(domains, skip, take)
};

const app = express();
app.use(morgan('dev'));

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
