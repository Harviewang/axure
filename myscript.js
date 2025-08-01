// IRR 计算函数：输入数组如 [-10000, 2000, 2500, ..., 6000]
irr: function (cashflows, guess = 0.1) {
  const maxIter = 1000;
  const tol = 1e-6;

  function npv(rate) {
    return cashflows.reduce((acc, val, i) => acc + val / Math.pow(1 + rate, i), 0);
  }

  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let f = npv(rate);
    let f1 = (npv(rate + tol) - f) / tol; // numerical derivative
    if (Math.abs(f1) < 1e-10) break; // avoid divide by zero
    let newRate = rate - f / f1;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  return null; // 未收敛
}

