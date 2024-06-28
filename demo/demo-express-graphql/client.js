import { ApolloClient, gql, InMemoryCache } from "@apollo/client/core/index.js";

const client = new ApolloClient({
  uri: "http://localhost:4000/graphql",
  cache: new InMemoryCache(),
});

client
  .query({
    query: gql`
      {
        countries(searchNames: ["island"]) {
          name
          areaKM2
          # areaPerPerson
        }
      }
    `,
  })
  .then((result) => {
    console.log(result.data.countries);
  });
