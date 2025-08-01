// myscript.js
window.myAxHelper = window.myAxHelper || {};
window.myAxHelperLoaded = true;

// IRR 计算函数（可被外部调用）
window.myAxHelper.irr = function (cashflows, guess = 0.1) {
  const tol = 1e-6;
  const maxIter = 1000;

  function npv(rate) {
    return cashflows.reduce((acc, val, i) => acc + val / Math.pow(1 + rate, i), 0);
  }

  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    const f = npv(rate);
    const f1 = (npv(rate + tol) - f) / tol;
    if (Math.abs(f1) < 1e-10) break;
    const newRate = rate - f / f1;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  return null;
};

// IRR 计算封装函数（用于按钮点击时调用）
window.myAxHelper.runIRR = function () {
  try {
    const cashflows = [];
    for (let i = 0; i <= 10; i++) {
      const val = parseFloat($axure(`@cf${i}`).text().trim());
      if (isNaN(val)) {
        $axure('@irrOut').text(`cf${i} 输入无效`);
        return;
      }
      cashflows.push(val);
    }

    const irr = window.myAxHelper.irr(cashflows);
    if (irr == null || isNaN(irr)) {
      $axure('@irrOut').text('IRR计算失败');
    } else {
      $axure('@irrOut').text((irr * 100).toFixed(2) + '%');
    }
  } catch (e) {
    $axure('@irrOut').text('脚本异常：' + e.message);
  }
};
