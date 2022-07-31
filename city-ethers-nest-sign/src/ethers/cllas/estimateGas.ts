import { Contract, ethers } from 'ethers'

export const estimateGas = async (
  contract: Contract,
  methodName: string,
  methodArgs: any[],
  gasMarginPer10000: number,
) => {
  if (!contract[methodName]) {
    throw new Error(`Method ${methodName} doesn't exist on ${contract.address}`)
  }
  const rawGasEstimation = await contract.estimateGas[methodName](...methodArgs)
  // By convention, ethers.BigNumber values are multiplied by 1000 to avoid dealing with real numbers 137854
  const gasEstimation = rawGasEstimation
    .mul(ethers.BigNumber.from(10000).add(ethers.BigNumber.from(gasMarginPer10000)))
    .div(ethers.BigNumber.from(10000))
  return gasEstimation
  
}
