const { network, ethers } = require("hardhat");
const fs = require("fs");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const EthUsdAggregator = await ethers.getContract("MockV3Aggregator");
    ethUsdPriceFeedAddress = EthUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
  }

  log("--------------------");

  const lowSVG = await fs.readFileSync("./images/dynamicNFT/frown.svg", {
    encoding: "utf-8",
  });
  const highSVG = await fs.readFileSync("./images/dynamicNFT/happy.svg", {
    encoding: "utf-8",
  });

  const args = [ethUsdPriceFeedAddress, lowSVG, highSVG];
  const dynamicSvgNFT = await deploy("DynamicSvgNFT", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("--------------------------");
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("verifying...");
    await verify(dynamicSvgNFT.address, args);
  }
};

module.exports.tags = ["all", "dynamicsvg", "main"];
