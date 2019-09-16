const { request } = require('graphql-request');

request(
  'http://localhost:4000/graphql',
  /* GraphQL */ `
    {
      countries(searchNames: ["island"]) {
        name
        areaKM2
        areaPerPerson
      }
    }
  `
).then(result => {
  console.log(result);
});
