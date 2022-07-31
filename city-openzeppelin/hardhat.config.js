require("@nomiclabs/hardhat-waffle")
// import '@openzeppelin/hardhat-upgrades'; // 引入 openzeppelin 升级插件，这样编写部署脚本就可以使用这个插件了


task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})


module.exports = {
  solidity: {
    // 配置多个编译版本
    compilers: [{ version: "0.8.9" }, { version: "0.6.2" }, { version: "0.7.0" }]
  },

  // 修改默认路径
  paths: {
    tests: "./test/open/安全"
  }
}
