const hre = require("hardhat");
const { ethers } = require("hardhat");

// Swap hesaplama fonksiyonları - string değerlerle çalışır
function getAmountOut(amountInStr, reserveInStr, reserveOutStr) {
  const amountIn = parseFloat(amountInStr);
  const reserveIn = parseFloat(reserveInStr);
  const reserveOut = parseFloat(reserveOutStr);
  
  const amountInWithFee = amountIn * 997; // %0.3 fee
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000 + amountInWithFee;
  return (numerator / denominator).toString();
}

function getAmountIn(amountOutStr, reserveInStr, reserveOutStr) {
  const amountOut = parseFloat(amountOutStr);
  const reserveIn = parseFloat(reserveInStr);
  const reserveOut = parseFloat(reserveOutStr);
  
  const numerator = reserveIn * amountOut * 1000;
  const denominator = (reserveOut - amountOut) * 997;
  return ((numerator / denominator) + 1).toString();
}

async function main() {
  console.log("Testing CosmoDEX swap functions...");
  
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
  const icecreamReserve = reserves[0];
  const usdcReserve = reserves[1];
  
  console.log(`ICECREAM reserve: ${ethers.formatUnits(icecreamReserve, icecreamDecimals)} ICECREAM`);
  console.log(`USDC reserve: ${ethers.formatUnits(usdcReserve, usdcDecimals)} USDC`);
  
  // 2. Fiyat hesaplamaları
  console.log("\n2. Price calculations...");
  
  // 2.1 ICECREAM -> USDC fiyatı
  // String olarak değerleri al
  const icecreamReserveStr = ethers.formatUnits(icecreamReserve, icecreamDecimals);
  const usdcReserveStr = ethers.formatUnits(usdcReserve, usdcDecimals);
  
  // Fiyat hesapla
  const icecreamToUsdcPrice = (parseFloat(usdcReserveStr) / parseFloat(icecreamReserveStr)).toFixed(6);
  console.log(`1 ICECREAM = ${icecreamToUsdcPrice} USDC`);
  
  // 2.2 USDC -> ICECREAM fiyatı
  const usdcToIcecreamPrice = (parseFloat(icecreamReserveStr) / parseFloat(usdcReserveStr)).toFixed(6);
  console.log(`1 USDC = ${usdcToIcecreamPrice} ICECREAM`);
  
  // 3. getAmountOut fonksiyonu testi
  console.log("\n3. Testing getAmountOut function...");
  
  // 3.1 ICECREAM -> USDC
  const icecreamAmountInStr = "10"; // 10 ICECREAM
  const icecreamAmountInWei = ethers.parseEther(icecreamAmountInStr); // 10 ICECREAM
  
  // Kendi hesaplama fonksiyonumuzu kullan
  const usdcAmountOutStr = getAmountOut(
    icecreamAmountInStr,
    icecreamReserveStr,
    usdcReserveStr
  );
  
  console.log(`Input: ${icecreamAmountInStr} ICECREAM`);
  console.log(`Expected output: ${parseFloat(usdcAmountOutStr).toFixed(6)} USDC`);
  
  // 3.2 USDC -> ICECREAM
  const usdcAmountInStr = "10"; // 10 USDC
  const usdcAmountInWei = ethers.parseUnits(usdcAmountInStr, usdcDecimals); // 10 USDC
  
  // Kendi hesaplama fonksiyonumuzu kullan
  const icecreamAmountOutStr = getAmountOut(
    usdcAmountInStr,
    usdcReserveStr,
    icecreamReserveStr
  );
  
  console.log(`Input: ${usdcAmountInStr} USDC`);
  console.log(`Expected output: ${parseFloat(icecreamAmountOutStr).toFixed(6)} ICECREAM`);
  
  // 4. getAmountIn fonksiyonu testi
  console.log("\n4. Testing getAmountIn function...");
  
  // 4.1 ICECREAM -> USDC
  const desiredUsdcOutStr = "10"; // 10 USDC
  const desiredUsdcOutWei = ethers.parseUnits(desiredUsdcOutStr, usdcDecimals); // 10 USDC
  
  // Kendi hesaplama fonksiyonumuzu kullan
  const requiredIcecreamInStr = getAmountIn(
    desiredUsdcOutStr,
    icecreamReserveStr,
    usdcReserveStr
  );
  
  console.log(`Desired output: ${desiredUsdcOutStr} USDC`);
  console.log(`Required input: ${parseFloat(requiredIcecreamInStr).toFixed(6)} ICECREAM`);
  
  // 4.2 USDC -> ICECREAM
  const desiredIcecreamOutStr = "10"; // 10 ICECREAM
  const desiredIcecreamOutWei = ethers.parseEther(desiredIcecreamOutStr); // 10 ICECREAM
  
  // Kendi hesaplama fonksiyonumuzu kullan
  const requiredUsdcInStr = getAmountIn(
    desiredIcecreamOutStr,
    usdcReserveStr,
    icecreamReserveStr
  );
  
  console.log(`Desired output: ${desiredIcecreamOutStr} ICECREAM`);
  console.log(`Required input: ${parseFloat(requiredUsdcInStr).toFixed(6)} USDC`);
  
  // 5. ICECREAM -> USDC swap
  console.log("\n5. Testing swap (ICECREAM -> USDC)...");
  
  // 5.1 Token'ları mint et
  const icecreamSwapAmountStr = "5"; // 5 ICECREAM
  const icecreamSwapAmount = ethers.parseEther(icecreamSwapAmountStr);
  console.log(`Minting ${icecreamSwapAmountStr} ICECREAM...`);
  
  try {
    const icecreamMintTx = await icecreamToken.mint(icecreamSwapAmount);
    await icecreamMintTx.wait();
    console.log("ICECREAM minted successfully!");
  } catch (error) {
    console.error("Error minting ICECREAM:", error.message);
    return;
  }
  
  // 5.2 Token'ları approve et
  console.log("Approving ICECREAM for CosmoDEX...");
  try {
    const icecreamApproveTx = await icecreamToken.approve(cosmoDEXAddress, icecreamSwapAmount);
    await icecreamApproveTx.wait();
    console.log("ICECREAM approved successfully!");
  } catch (error) {
    console.error("Error approving ICECREAM:", error.message);
    return;
  }
  
  // 5.3 Swap öncesi bakiyeleri kontrol et
  const beforeSwapIcecreamBalance = await icecreamToken.balanceOf(account.address);
  const beforeSwapUsdcBalance = await testUSDC.balanceOf(account.address);
  
  console.log(`Before swap - ICECREAM balance: ${ethers.formatUnits(beforeSwapIcecreamBalance, icecreamDecimals)} ICECREAM`);
  console.log(`Before swap - USDC balance: ${ethers.formatUnits(beforeSwapUsdcBalance, usdcDecimals)} USDC`);
  
  // 5.4 Beklenen çıkış miktarını hesapla
  const updatedReserves = await cosmoDEX.getReserves();
  const updatedIcecreamReserve = updatedReserves[0];
  const updatedUsdcReserve = updatedReserves[1];
  
  const updatedIcecreamReserveStr = ethers.formatUnits(updatedIcecreamReserve, icecreamDecimals);
  const updatedUsdcReserveStr = ethers.formatUnits(updatedUsdcReserve, usdcDecimals);
  
  const expectedUsdcOutStr = getAmountOut(
    icecreamSwapAmountStr,
    updatedIcecreamReserveStr,
    updatedUsdcReserveStr
  );
  
  console.log(`Expected USDC output: ${parseFloat(expectedUsdcOutStr).toFixed(6)} USDC`);
  
  // 5.5 Swap işlemi
  try {
    console.log("Executing swap...");
    // %5 slippage toleransı için
    const minUsdcOutNum = parseFloat(expectedUsdcOutStr) * 0.95;
    const minUsdcOutStr = minUsdcOutNum.toFixed(6);
    const minUsdcOut = ethers.parseUnits(minUsdcOutStr, usdcDecimals);
    
    console.log(`Minimum USDC output (with 5% slippage): ${minUsdcOutStr} USDC`);
    
    // Doğru fonksiyon adını kullan (büyük-küçük harf farkına dikkat et)
    const swapTx = await cosmoDEX.swapIcecreamForUsdc(
      icecreamSwapAmount,
      minUsdcOut
    );
    
    const receipt = await swapTx.wait();
    console.log("Swap executed successfully!");
  } catch (error) {
    console.error("Error executing swap:", error.message);
    return;
  }
  
  // 5.6 Swap sonrası bakiyeleri kontrol et
  const afterSwapIcecreamBalance = await icecreamToken.balanceOf(account.address);
  const afterSwapUsdcBalance = await testUSDC.balanceOf(account.address);
  
  console.log(`After swap - ICECREAM balance: ${ethers.formatUnits(afterSwapIcecreamBalance, icecreamDecimals)} ICECREAM`);
  console.log(`After swap - USDC balance: ${ethers.formatUnits(afterSwapUsdcBalance, usdcDecimals)} USDC`);
  
  // BigInt çıkarma işlemleri
  const icecreamSpent = beforeSwapIcecreamBalance - afterSwapIcecreamBalance;
  const usdcReceived = afterSwapUsdcBalance - beforeSwapUsdcBalance;
  
  console.log(`ICECREAM spent: ${ethers.formatUnits(icecreamSpent, icecreamDecimals)} ICECREAM`);
  console.log(`USDC received: ${ethers.formatUnits(usdcReceived, usdcDecimals)} USDC`);
  
  // 5.7 Yeni rezervleri kontrol et
  const afterSwapReserves = await cosmoDEX.getReserves();
  console.log(`New ICECREAM reserve: ${ethers.formatUnits(afterSwapReserves[0], icecreamDecimals)} ICECREAM`);
  console.log(`New USDC reserve: ${ethers.formatUnits(afterSwapReserves[1], usdcDecimals)} USDC`);
  
  console.log("\nSwap function tests completed!");

  // 6. USDC -> ICECREAM swap
  console.log("\n6. Testing swap (USDC -> ICECREAM)...");
  
  // 6.1 Token'ları mint et
  const usdcSwapAmountStr = "5"; // 5 USDC
  const usdcSwapAmount = ethers.parseUnits(usdcSwapAmountStr, usdcDecimals); // 5 USDC
  console.log(`Minting ${usdcSwapAmountStr} USDC...`);
  
  try {
    const usdcMintTx = await testUSDC.mint(usdcSwapAmount);
    await usdcMintTx.wait();
    console.log("USDC minted successfully!");
  } catch (error) {
    console.error("Error minting USDC:", error.message);
    return;
  }
  
  // 6.2 Token'ları approve et
  console.log("Approving USDC for CosmoDEX...");
  try {
    const usdcApproveTx = await testUSDC.approve(cosmoDEXAddress, usdcSwapAmount);
    await usdcApproveTx.wait();
    console.log("USDC approved successfully!");
  } catch (error) {
    console.error("Error approving USDC:", error.message);
    return;
  }
  
  // 6.3 Swap öncesi bakiyeleri kontrol et
  const beforeSwap2UsdcBalance = await testUSDC.balanceOf(account.address);
  const beforeSwap2IcecreamBalance = await icecreamToken.balanceOf(account.address);
  
  console.log(`Before swap - USDC balance: ${ethers.formatUnits(beforeSwap2UsdcBalance, usdcDecimals)} USDC`);
  console.log(`Before swap - ICECREAM balance: ${ethers.formatUnits(beforeSwap2IcecreamBalance, icecreamDecimals)} ICECREAM`);
  
  // 6.4 Beklenen çıkış miktarını hesapla
  const updatedReserves2 = await cosmoDEX.getReserves();
  const updatedIcecreamReserve2 = updatedReserves2[0];
  const updatedUsdcReserve2 = updatedReserves2[1];
  
  const updatedIcecreamReserveStr2 = ethers.formatUnits(updatedIcecreamReserve2, icecreamDecimals);
  const updatedUsdcReserveStr2 = ethers.formatUnits(updatedUsdcReserve2, usdcDecimals);
  
  const expectedIcecreamOutStr = getAmountOut(
    usdcSwapAmountStr,
    updatedUsdcReserveStr2,
    updatedIcecreamReserveStr2
  );
  
  console.log(`Expected ICECREAM output: ${parseFloat(expectedIcecreamOutStr).toFixed(6)} ICECREAM`);
  
  // 6.5 Swap işlemi
  try {
    console.log("Executing swap...");
    // %5 slippage toleransı için
    const minIcecreamOutNum = parseFloat(expectedIcecreamOutStr) * 0.95;
    const minIcecreamOutStr = minIcecreamOutNum.toFixed(6);
    const minIcecreamOut = ethers.parseEther(minIcecreamOutStr);
    
    console.log(`Minimum ICECREAM output (with 5% slippage): ${minIcecreamOutStr} ICECREAM`);
    
    // Doğru fonksiyon adını kullan (büyük-küçük harf farkına dikkat et)
    const swapTx = await cosmoDEX.swapUsdcForIcecream(
      usdcSwapAmount,
      minIcecreamOut
    );
    
    const receipt = await swapTx.wait();
    console.log("Swap executed successfully!");
  } catch (error) {
    console.error("Error executing swap:", error.message);
    return;
  }
  
  // 6.6 Swap sonrası bakiyeleri kontrol et
  const afterSwap2IcecreamBalance = await icecreamToken.balanceOf(account.address);
  const afterSwap2UsdcBalance = await testUSDC.balanceOf(account.address);
  
  console.log(`After swap - ICECREAM balance: ${ethers.formatUnits(afterSwap2IcecreamBalance, icecreamDecimals)} ICECREAM`);
  console.log(`After swap - USDC balance: ${ethers.formatUnits(afterSwap2UsdcBalance, usdcDecimals)} USDC`);
  
  // BigInt çıkarma işlemleri
  const usdcSpent2 = beforeSwap2UsdcBalance - afterSwap2UsdcBalance;
  const icecreamReceived2 = afterSwap2IcecreamBalance - beforeSwap2IcecreamBalance;
  
  console.log(`USDC spent: ${ethers.formatUnits(usdcSpent2, usdcDecimals)} USDC`);
  console.log(`ICECREAM received: ${ethers.formatUnits(icecreamReceived2, icecreamDecimals)} ICECREAM`);
  
  // 6.7 Yeni rezervleri kontrol et
  const afterSwap2Reserves = await cosmoDEX.getReserves();
  console.log(`New ICECREAM reserve: ${ethers.formatUnits(afterSwap2Reserves[0], icecreamDecimals)} ICECREAM`);
  console.log(`New USDC reserve: ${ethers.formatUnits(afterSwap2Reserves[1], usdcDecimals)} USDC`);
  
  console.log("\nSwap function tests completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 