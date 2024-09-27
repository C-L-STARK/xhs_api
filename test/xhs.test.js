const XhsClient = require('../src/index.js')
const { SearchSortType, SearchNoteType } = require('../src/help.js');

// Replace with a valid cookie
const cookie = '';

const client = new XhsClient({ cookie });

// Increase the timeout for each test to 30 seconds
jest.setTimeout(30000);

describe('XhsClient', () => {
  test('searchUser', async () => {
    const result = await client.searchUser(keyword = "小宇宙");
    console.log(result);
    expect(result).toBeDefined();
  });
});

