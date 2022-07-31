import { ethers, utils } from 'ethers'
var bip39 = require('bip39')

let privateKey =
  '7f42446373e0cd2f862f9e05c1760d8370401144d8cf311bef97a5e83cc6fc08'
let wallet = new ethers.Wallet(privateKey)

//0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6
//0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6
//0x2Ba35ec8Df4573Bd5D6c69028D47f25A72912a95
//0x5FB8bEF9257aC977D0D88669F4D642D2050cd584
console.log(utils.id('1'))

console.log(wallet.address)

let provider = ethers.getDefaultProvider()
let walletWithProvider = new ethers.Wallet(privateKey, provider)

// 使用一个密码来创建私钥，就算私钥丢弃了，也是可以通过这个密码来推导出私钥
let password = 'guomingcheng1234567890'
// 把秘密字符串转换为，字节类型，才能使用 keccak256 哈希运算
let passwordBytes = utils.toUtf8Bytes(password)
// 这里运算的 32 位字节，就可以用作于私钥，在以太网上进行交易以及签名
console.log(utils.keccak256(passwordBytes))

console.log(utils.computeAddress(utils.keccak256(passwordBytes)))

console.log(utils.computePublicKey(utils.keccak256(passwordBytes), true))

console.log(
  utils.computeAddress(
    '0x0333029f8035abb75168c685a7781982c5bd410577bbc2ecbbcce6656a1dd59cab'
  )
)

console.log(bip39.generateMnemonic())

export {}
