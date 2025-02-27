const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing CosmoDEX core functions...");
  
  const [account] = await ethers.getSigners();
  console.log("Using account:", account.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(account.address)), "ETH");
  
  // CosmoDEX kontrat adresi
  const cosmoDEXAddress = "0x68Ef81065Bcad75401B1df5923611DfFD29596cc"; // Mevcut deploy edilen adres
  console.log("\nCosmoDEX address:", cosmoDEXAddress);
  
  // CosmoDEX kontratına erişim
  const CosmoDEX = await ethers.getContractFactory("CosmoDEX");
  const cosmoDEX = CosmoDEX.attach(cosmoDEXAddress);
  
  // Token adreslerini al
  const icecreamTokenAddress = await cosmoDEX.icecreamToken();
  const usdcTokenAddress = await cosmoDEX.usdcToken();
  
  console.log("\nToken addresses:");
  console.log("IcecreamToken:", icecreamTokenAddress);
  console.log("TestUSDC:", usdcTokenAddress);
  
  // Token kontratlarına erişim
  const IcecreamToken = await ethers.getContractFactory("IcecreamToken");
  const icecreamToken = IcecreamToken.attach(icecreamTokenAddress);
  
  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const testUSDC = TestUSDC.attach(usdcTokenAddress);
  
  // Token bilgilerini al
  const icecreamDecimals = await icecreamToken.decimals();
  const usdcDecimals = await testUSDC.decimals();
  
  // Başlangıç bakiyelerini kontrol et
  const initialIcecreamBalance = await icecreamToken.balanceOf(account.address);
  const initialUsdcBalance = await testUSDC.balanceOf(account.address);
  
  console.log("\nInitial token balances:");
  console.log(`ICECREAM balance: ${ethers.formatUnits(initialIcecreamBalance, icecreamDecimals)} ICECREAM`);
  console.log(`USDC balance: ${ethers.formatUnits(initialUsdcBalance, usdcDecimals)} USDC`);
  
  // 1. Mevcut rezervleri kontrol et
  console.log("\n1. Checking current reserves...");
  const reserves = await cosmoDEX.getReserves();
  console.log(`ICECREAM reserve: ${ethers.formatUnits(reserves[0], icecreamDecimals)} ICECREAM`);
  console.log(`USDC reserve: ${ethers.formatUnits(reserves[1], usdcDecimals)} USDC`);
  
  // 2. Likidite ekleme
  console.log("\n2. Testing addLiquidity function...");
  try {
    // Önce token'ları mint et
    const icecreamAmount = ethers.parseEther("100"); // 100 ICECREAM
    const usdcAmount = ethers.parseUnits("100", 6); // 100 USDC
    
    console.log(`Minting ${ethers.formatUnits(icecreamAmount, icecreamDecimals)} ICECREAM and ${ethers.formatUnits(usdcAmount, usdcDecimals)} USDC...`);
    
    // ICECREAM mint
    const icecreamMintTx = await icecreamToken.mint(icecreamAmount);
    await icecreamMintTx.wait();
    
    // USDC mint
    const usdcMintTx = await testUSDC.mint(usdcAmount);
    await usdcMintTx.wait();
    
    // Token'ları approve et
    console.log("Approving tokens for CosmoDEX...");
    
    const icecreamApproveTx = await icecreamToken.approve(cosmoDEXAddress, icecreamAmount);
    await icecreamApproveTx.wait();
    
    const usdcApproveTx = await testUSDC.approve(cosmoDEXAddress, usdcAmount);
    await usdcApproveTx.wait();
    
    // Likidite ekle
    console.log("Adding liquidity...");
    const minLiquidity = 0; // Minimum likidite (ilk likidite sağlayıcı için 0)
    
    const addLiquidityTx = await cosmoDEX.addLiquidity(
      icecreamAmount,
      usdcAmount,
      minLiquidity
    );
    const receipt = await addLiquidityTx.wait();
    
    // AddLiquidity event'ini bul
    const addLiquidityEvent = receipt.logs
      .filter(log => log.fragment && log.fragment.name === 'AddLiquidity')
      .map(log => cosmoDEX.interface.parseLog(log))[0];
    
    if (addLiquidityEvent) {
      const liquidityMinted = addLiquidityEvent.args.liquidityMinted;
      console.log(`Liquidity added successfully! Liquidity tokens minted: ${ethers.formatEther(liquidityMinted)}`);
    } else {
      console.log("Liquidity added successfully!");
    }
    
    // Yeni rezervleri kontrol et
    const newReserves = await cosmoDEX.getReserves();
    console.log(`New ICECREAM reserve: ${ethers.formatUnits(newReserves[0], icecreamDecimals)} ICECREAM`);
    console.log(`New USDC reserve: ${ethers.formatUnits(newReserves[1], usdcDecimals)} USDC`);
    
    // Likidite bakiyesini kontrol et
    const liquidityBalance = await cosmoDEX.liquidity(account.address);
    console.log(`Liquidity balance: ${ethers.formatEther(liquidityBalance)}`);
  } catch (error) {
    console.error("Error adding liquidity:", error.message);
    console.log(error);
  }
  
  // 3. Swap işlemleri
  console.log("\n3. Testing swap functions...");
  
  // 3.1 ICECREAM -> USDC swap
  console.log("\n3.1 Testing swapIcecreamForUSDC...");
  try {
    // Swap için ICECREAM miktarı
    const icecreamSwapAmount = ethers.parseEther("10"); // 10 ICECREAM
    
    // Önce ICECREAM mint et
    const icecreamMintTx = await icecreamToken.mint(icecreamSwapAmount);
    await icecreamMintTx.wait();
    
    // ICECREAM'i approve et
    const icecreamApproveTx = await icecreamToken.approve(cosmoDEXAddress, icecreamSwapAmount);
    await icecreamApproveTx.wait();
    
    // Swap öncesi bakiyeleri kontrol et
    const beforeSwapIcecreamBalance = await icecreamToken.balanceOf(account.address);
    const beforeSwapUsdcBalance = await testUSDC.balanceOf(account.address);
    
    console.log(`Before swap - ICECREAM balance: ${ethers.formatUnits(beforeSwapIcecreamBalance, icecreamDecimals)} ICECREAM`);
    console.log(`Before swap - USDC balance: ${ethers.formatUnits(beforeSwapUsdcBalance, usdcDecimals)} USDC`);
    
    // Minimum çıkış miktarını hesapla
    const reserves = await cosmoDEX.getReserves();
    const minUsdcOut = await cosmoDEX.getAmountOut(icecreamSwapAmount, reserves[0], reserves[1]);
    console.log(`Expected minimum USDC out: ${ethers.formatUnits(minUsdcOut, usdcDecimals)} USDC`);
    
    // Swap işlemi
    const swapTx = await cosmoDEX.swapIcecreamForUSDC(
      icecreamSwapAmount,
      minUsdcOut.mul(95).div(100) // %5 slippage toleransı
    );
    await swapTx.wait();
    
    // Swap sonrası bakiyeleri kontrol et
    const afterSwapIcecreamBalance = await icecreamToken.balanceOf(account.address);
    const afterSwapUsdcBalance = await testUSDC.balanceOf(account.address);
    
    console.log(`After swap - ICECREAM balance: ${ethers.formatUnits(afterSwapIcecreamBalance, icecreamDecimals)} ICECREAM`);
    console.log(`After swap - USDC balance: ${ethers.formatUnits(afterSwapUsdcBalance, usdcDecimals)} USDC`);
    
    console.log(`ICECREAM spent: ${ethers.formatUnits(beforeSwapIcecreamBalance - afterSwapIcecreamBalance, icecreamDecimals)} ICECREAM`);
    console.log(`USDC received: ${ethers.formatUnits(afterSwapUsdcBalance - beforeSwapUsdcBalance, usdcDecimals)} USDC`);
  } catch (error) {
    console.error("Error swapping ICECREAM for USDC:", error.message);
    console.log(error);
  }
  
  // 3.2 USDC -> ICECREAM swap
  console.log("\n3.2 Testing swapUSDCForIcecream...");
  try {
    // Swap için USDC miktarı
    const usdcSwapAmount = ethers.parseUnits("10", 6); // 10 USDC
    
    // Önce USDC mint et
    const usdcMintTx = await testUSDC.mint(usdcSwapAmount);
    await usdcMintTx.wait();
    
    // USDC'yi approve et
    const usdcApproveTx = await testUSDC.approve(cosmoDEXAddress, usdcSwapAmount);
    await usdcApproveTx.wait();
    
    // Swap öncesi bakiyeleri kontrol et
    const beforeSwapIcecreamBalance = await icecreamToken.balanceOf(account.address);
    const beforeSwapUsdcBalance = await testUSDC.balanceOf(account.address);
    
    console.log(`Before swap - ICECREAM balance: ${ethers.formatUnits(beforeSwapIcecreamBalance, icecreamDecimals)} ICECREAM`);
    console.log(`Before swap - USDC balance: ${ethers.formatUnits(beforeSwapUsdcBalance, usdcDecimals)} USDC`);
    
    // Minimum çıkış miktarını hesapla
    const reserves = await cosmoDEX.getReserves();
    const minIcecreamOut = await cosmoDEX.getAmountOut(usdcSwapAmount, reserves[1], reserves[0]);
    console.log(`Expected minimum ICECREAM out: ${ethers.formatUnits(minIcecreamOut, icecreamDecimals)} ICECREAM`);
    
    // Swap işlemi
    const swapTx = await cosmoDEX.swapUSDCForIcecream(
      usdcSwapAmount,
      minIcecreamOut.mul(95).div(100) // %5 slippage toleransı
    );
    await swapTx.wait();
    
    // Swap sonrası bakiyeleri kontrol et
    const afterSwapIcecreamBalance = await icecreamToken.balanceOf(account.address);
    const afterSwapUsdcBalance = await testUSDC.balanceOf(account.address);
    
    console.log(`After swap - ICECREAM balance: ${ethers.formatUnits(afterSwapIcecreamBalance, icecreamDecimals)} ICECREAM`);
    console.log(`After swap - USDC balance: ${ethers.formatUnits(afterSwapUsdcBalance, usdcDecimals)} USDC`);
    
    console.log(`USDC spent: ${ethers.formatUnits(beforeSwapUsdcBalance - afterSwapUsdcBalance, usdcDecimals)} USDC`);
    console.log(`ICECREAM received: ${ethers.formatUnits(afterSwapIcecreamBalance - beforeSwapIcecreamBalance, icecreamDecimals)} ICECREAM`);
  } catch (error) {
    console.error("Error swapping USDC for ICECREAM:", error.message);
    console.log(error);
  }
  
  // 4. Likidite çıkarma
  console.log("\n4. Testing removeLiquidity function...");
  try {
    // Likidite bakiyesini kontrol et
    const liquidityBalance = await cosmoDEX.liquidity(account.address);
    console.log(`Current liquidity balance: ${ethers.formatEther(liquidityBalance)}`);
    
    if (liquidityBalance.gt(0)) {
      // Çıkarılacak likidite miktarı (toplam likiditenin %50'si)
      const liquidityToRemove = liquidityBalance.div(2);
      console.log(`Removing ${ethers.formatEther(liquidityToRemove)} liquidity tokens...`);
      
      // Minimum token miktarlarını hesapla
      const reserves = await cosmoDEX.getReserves();
      const totalLiquidity = await cosmoDEX.totalLiquidity();
      
      const minIcecreamOut = reserves[0].mul(liquidityToRemove).div(totalLiquidity).mul(95).div(100); // %5 slippage
      const minUsdcOut = reserves[1].mul(liquidityToRemove).div(totalLiquidity).mul(95).div(100); // %5 slippage
      
      console.log(`Expected minimum ICECREAM out: ${ethers.formatUnits(minIcecreamOut, icecreamDecimals)} ICECREAM`);
      console.log(`Expected minimum USDC out: ${ethers.formatUnits(minUsdcOut, usdcDecimals)} USDC`);
      
      // Likidite çıkarma işlemi
      const removeLiquidityTx = await cosmoDEX.removeLiquidity(
        liquidityToRemove,
        minIcecreamOut,
        minUsdcOut
      );
      const receipt = await removeLiquidityTx.wait();
      
      // RemoveLiquidity event'ini bul
      const removeLiquidityEvent = receipt.logs
        .filter(log => log.fragment && log.fragment.name === 'RemoveLiquidity')
        .map(log => cosmoDEX.interface.parseLog(log))[0];
      
      if (removeLiquidityEvent) {
        const icecreamAmount = removeLiquidityEvent.args.icecreamAmount;
        const usdcAmount = removeLiquidityEvent.args.usdcAmount;
        console.log(`Liquidity removed successfully!`);
        console.log(`ICECREAM received: ${ethers.formatUnits(icecreamAmount, icecreamDecimals)} ICECREAM`);
        console.log(`USDC received: ${ethers.formatUnits(usdcAmount, usdcDecimals)} USDC`);
      } else {
        console.log("Liquidity removed successfully!");
      }
      
      // Yeni likidite bakiyesini kontrol et
      const newLiquidityBalance = await cosmoDEX.liquidity(account.address);
      console.log(`New liquidity balance: ${ethers.formatEther(newLiquidityBalance)}`);
      
      // Yeni rezervleri kontrol et
      const newReserves = await cosmoDEX.getReserves();
      console.log(`New ICECREAM reserve: ${ethers.formatUnits(newReserves[0], icecreamDecimals)} ICECREAM`);
      console.log(`New USDC reserve: ${ethers.formatUnits(newReserves[1], usdcDecimals)} USDC`);
    } else {
      console.log("No liquidity to remove.");
    }
  } catch (error) {
    console.error("Error removing liquidity:", error.message);
    console.log(error);
  }
  
  // 5. Final bakiyeleri kontrol et
  console.log("\n5. Final token balances:");
  const finalIcecreamBalance = await icecreamToken.balanceOf(account.address);
  const finalUsdcBalance = await testUSDC.balanceOf(account.address);
  
  console.log(`ICECREAM balance: ${ethers.formatUnits(finalIcecreamBalance, icecreamDecimals)} ICECREAM`);
  console.log(`USDC balance: ${ethers.formatUnits(finalUsdcBalance, usdcDecimals)} USDC`);
  
  console.log(`\nTotal change in balances:`);
  console.log(`ICECREAM: ${ethers.formatUnits(finalIcecreamBalance - initialIcecreamBalance, icecreamDecimals)} ICECREAM`);
  console.log(`USDC: ${ethers.formatUnits(finalUsdcBalance - initialUsdcBalance, usdcDecimals)} USDC`);
  
  console.log("\nCosmoDEX function tests completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 