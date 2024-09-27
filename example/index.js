const XhsClient = require("../src/index.js");

const cookie = "";

const client = new XhsClient({
  cookie: cookie,
});

async function testSearchUser() {
  const keyword = "小宇宙";
  const client = new XhsClient({
    cookie: cookie,
  });
  const result = await client.searchUser(keyword);
  console.log(result);
}

testSearchUser();