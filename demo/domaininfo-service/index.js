const express = require('express');
const Promise = require('bluebird');
const whois = require('whois');
const morgan = require('morgan');
const retry = require('p-retry');

const lookup = domain =>
  new Promise((r, f) => {
    whois.lookup(domain, (err, data) => {
      if (err) f(err);
      else r(data);
    });
  });

const splitLine = line => {
  const [, name, content] = line.match(/\s*([^:]+):\s*(.*)\s*/);
  return { [name]: content };
};

const getWhoisInfo = (domain, records = ['Creation Date', 'Registered on']) =>
  retry(
    () =>
      lookup(domain)
        .catch(err => {
          if (!err.errno === 'ECONNRESET') throw new retry.AbortError(err);
          throw err; // retry
        })
        .then(res => {
          if (!res) throw new Error(); // retry
          return res;
        }),
    {
      retries: 5,
      onFailedAttempt: err => {
        console.log(
          `Fetching whois for ${domain} failed ${err.attemptNumber} time(s)`
        );
      }
    }
  )
    .then(data => data.split('\n'))
    .then(lines =>
      lines.filter(line =>
        records.reduce(
          (r, v) => r || line.trimStart().startsWith(`${v}:`),
          false
        )
      )
    )
    .then(lines => lines.reduce((r, v) => ({ ...r, ...splitLine(v) }), {}))
    .catch(err => {
      console.error(`Whois Error (${domain}): ${err}`);
    });

const dns = require('dns').promises;
const getMx = domain =>
  dns
    .resolve(domain, 'MX')
    .then(
      records =>
        (records &&
          records.length &&
          records.sort((r1, r2) => r1.priority - r2.priority)) ||
        []
    )
    .then(records => (records.length && records[0].exchange) || '<unknown>')
    .catch(err => {
      console.error(`DNS Error: ${err}`);
    });

const resultCache = {};
const app = express();
app.use(morgan('dev'));

app.get('/domaininfo', (req, res) => {
  const domain = req.query.q;
  if (!domain) {
    res.status(400).send('Bad request');
  } else {
    const start = resultCache[domain]
      ? Promise.resolve(resultCache[domain])
      : Promise.all([getMx(domain), getWhoisInfo(domain)])
          .then(([mx, whoisInfo]) => ({ primaryMx: mx, whoisInfo }))
          .then(result => {
            resultCache[domain] = result;
            return result;
          });
    return start.then(result => {
      res.json(result);
    });
  }
});

app.listen(3003, () => {
  console.log('Domain Info service listening on 3003.');
});
