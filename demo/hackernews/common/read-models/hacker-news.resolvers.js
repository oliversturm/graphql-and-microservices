var { buildSchema, parse, execute } = require('graphql');
const { importSchema } = require('graphql-import');

const getStories = async (type, store, { first, offset }) => {
  const segment = store.performanceTracer.getSegment();
  const subSegment = segment.addNewSubsegment('resolver');

  subSegment.addAnnotation('type', type);
  subSegment.addAnnotation('origin', 'hacker-news:getStories');

  try {
    const search = type && type.constructor === String ? { type } : {};
    const skip = first || 0;
    const stories = await store.find(
      'Stories',
      search,
      null,
      { createdAt: -1 },
      skip,
      offset
    );

    return Array.isArray(stories) ? stories : [];
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error);
    }
    throw error;
  } finally {
    if (subSegment != null) {
      subSegment.close();
    }
  }
};

const getStory = async (store, { id }) => {
  const story = await store.findOne('Stories', { id: id.toString() });

  if (!story) {
    return null;
  }

  const type = !story.link
    ? 'ask'
    : /^(Show HN)/.test(story.title)
    ? 'show'
    : 'story';

  Object.assign(story, { type });

  return story;
};

const getUser = async (store, { id, name }) => {
  const user =
    name != null
      ? await store.findOne('Users', { name })
      : id != null
      ? await store.findOne('Users', { id })
      : null;

  return user;
};

// const storiesSchemaText = /* GraphQL */ `
//   type Story {
//     title: String!
//     text: String
//     link: String
//     commentCount: Int!
//     createdAt: Int!
//     createdBy: String!
//     createdByName: String!
//     id: String!
//     type: String!
//     votes: [String]!
//   }

//   type Query {
//     stories: [Story]!
//   }
// `;

// const storiesSchema = buildSchema(storiesSchemaText);

// const storiesGraphQL = async (store, { query, variables }) => {
//   const document = parse(query);

//   // Consider optimizing queries by analyzing the document.
//   // For instance, document.definitions[].selectionSet has
//   // the specific items that are queried. This is just an
//   // example that lacks handling of many cases.

//   // const fromSet = set =>
//   //   set.kind === 'SelectionSet' &&
//   //   set.selections.map(s => ({
//   //     name: s.name.value,
//   //     subSelections: s.selectionSet
//   //   }));
//   // const [stories] = fromSet(document.definitions[0].selectionSet);
//   // const selectedFields = fromSet(stories.subSelections);
//   // const fieldMap = sfs => sfs.reduce((r, v) => ({ ...r, [v.name]: 1 }), {});

//   // const rootValue = {
//   //   stories: async () =>
//   //     await store.find('Stories', {}, fieldMap(selectedFields), {})
//   // };

//   const rootValue = {
//     stories: async () => await store.find('Stories', {}, null, {})
//   };

//   const { data, errors } = await execute({
//     schema: storiesSchema,
//     document,
//     rootValue,
//     variableValues: variables
//   });
//   if (errors) {
//     console.log('Errors: ', errors);
//     throw new Error(errors);
//   } else return data;
// };

export default {
  story: getStory,

  allStories: getStories.bind(null, null),

  askStories: getStories.bind(null, 'ask'),

  showStories: getStories.bind(null, 'show'),

  user: getUser

  //  storiesGraphQL
};
