const baseUrl = "https://api-dexfolio.org/api";
// const baseUrl = "http://192.168.0.111:3000/api";

export const governorApi = {
  getAllProposals: `${baseUrl}/proposals`,
  getProposalById: (proposalId) => (`${baseUrl}/proposals/${proposalId}`),
  getProposalStatistics: `${baseUrl}/proposals/statistics`,
  getAllVoters: `${baseUrl}/voters/accounts`,
  getVoterHistoryByAddr: (addr) => (`${baseUrl}/voters/history/${addr}`),
  getVotersByProposalId: (proposalId) => (`${baseUrl}/voters/${proposalId}`),
}

export const adminApi = {
  getStakers: (offset, limit) => `${baseUrl}/stakers?offset=${offset}&limit=${limit}`,
  getStakes: (address, offset, limit) => {
    if (address) {
      return `${baseUrl}/stakes/${address}?offset=${offset}&limit=${limit}`;
    }

    return `${baseUrl}/stakes?offset=${offset}&limit=${limit}`;
  },
  exportStakers: `${baseUrl}/excel/stakers`,
  exportStakes: `${baseUrl}/excel/stakes`,
  exportStakesTotal: `${baseUrl}/excel/stakes/total`,
}

export const request = (url, option) => {
  // let token = localStorage.getItem('access_token', '');
  const option1 = {
    headers: {
      // Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    ...option,
  }
  // console.log(option1)
  return fetch(url, option1)
    .then(response => {
      // console.log(response);
      if (response.status >= 200 && response.status <= 299) {
        return response.json();
      }

      return Promise.reject(response.statusText);
    })
}
