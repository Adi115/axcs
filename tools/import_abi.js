const fs = require('fs').promises;
const Axios = require('axios').default;
const address = require('./address.json');

const network = process.argv[2] ? process.argv[2]: "mainnet";
const baseURL = process.argv[2] ? 'http://api-' + network + '.etherscan.io' : 'http://api.etherscan.io';
const TARGET_FOLDER = 'src/web3/abi';

const axios = Axios.create({
  baseURL: baseURL
});

function loadABI(name, address) {
  console.info(`Loading ${name} ABI...`);

  return axios.get('/api', {
    params: {
      module: 'contract',
      action: 'getabi',
      format: 'raw',
      address,
    },
  }).then(({ data }) => {
    return fs.writeFile(`${TARGET_FOLDER}/${name}.json`, JSON.stringify(data), 'utf8');
  }).catch(error => {
    console.error(error);
  });
}

function delay() {
  return new Promise(resolve => {
    setTimeout(resolve, 5000);
  });
}

function PromiseSequence(tasks, cb) {
  const results = [];

  return tasks
    .reduce(
      (p, task, index) =>
        p
          .then(() => cb(task, index, tasks))
          .then(result => results.push(result))
          .catch(err => results.push(Promise.reject(err))),
      Promise.resolve()
    )
    .then(() => results);
};

(async () => {
  PromiseSequence([
    ['busd', address.CONTRACT_BUSD[network]],
    ['dexf-bnb-lp', address.CONTRACT_DEXF_BNB_LP[network]],
    ['dexf', address.CONTRACT_DEXF[network]],
    ['eth', address.CONTRACT_ETH[network]],
    ['governor', address.CONTRACT_GOVERNOR[network]],
    ['lp-farming', address.CONTRACT_LP_FARMING[network]],
    ['v2-router', address.CONTRACT_UNISWAP_V2[network]],
    ['wbtc', address.CONTRACT_WBTC[network]],
  ], ([name, address]) => {
    return loadABI(name, address).then(delay);
  });
})();
